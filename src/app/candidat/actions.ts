"use server";

import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { limitaCv, abonamentEfectiv } from "@/lib/planuri";
import { calculeazaVarsta } from "@/lib/varsta";
import { StudiiNivel, StudiiStatus } from "@/generated/prisma/enums";

export type FormState = { error?: string; success?: boolean } | undefined;

const ALLOWED_CV_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_POZA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_POZA_SIZE_BYTES = 5 * 1024 * 1024;
const SEXE_PERMISE = ["Masculin", "Feminin", "Altul"];

function parseOptionalInt(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function parseSkills(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of value.split(",")) {
    const skill = raw.trim();
    if (skill && !seen.has(skill)) {
      seen.add(skill);
      result.push(skill);
    }
  }
  return result;
}

async function saveCvFile(userId: string, file: File): Promise<string> {
  const t = await getTranslations("candidate");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
    throw new Error(t("errorCvFileType"));
  }
  if (file.size > MAX_CV_SIZE_BYTES) {
    throw new Error(t("errorCvTooLarge"));
  }
  const uploadsDir = path.join(process.cwd(), "uploads", "cv");
  await mkdir(uploadsDir, { recursive: true });
  const fisierNume = `${userId}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fisierNume), buffer);
  return fisierNume;
}

async function savePozaFile(userId: string, file: File): Promise<string> {
  const t = await getTranslations("candidate");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_POZA_EXTENSIONS.includes(ext)) {
    throw new Error(t("errorPhotoType"));
  }
  if (file.size > MAX_POZA_SIZE_BYTES) {
    throw new Error(t("errorPhotoTooLarge"));
  }
  const uploadsDir = path.join(process.cwd(), "uploads", "poze");
  await mkdir(uploadsDir, { recursive: true });
  const fisierNume = `${userId}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fisierNume), buffer);
  return fisierNume;
}

export async function addCvAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("candidate");
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return { error: t("errorMustBeCandidate") };
  }
  const userId = session.user.id;

  const eticheta = String(formData.get("eticheta") || "").trim();
  if (!eticheta) {
    return { error: t("errorCvNameRequired") };
  }

  const cvFile = formData.get("cv");
  if (!(cvFile instanceof File) || cvFile.size === 0) {
    return { error: t("errorChooseFile") };
  }

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      _count: { select: { cvFiles: true } },
      user: { select: { abonamentTip: true, isAdmin: true, email: true } },
    },
  });
  if (!candidate) {
    return { error: t("errorCompleteProfileFirst") };
  }
  const limita = limitaCv(abonamentEfectiv(candidate.user));
  if (candidate._count.cvFiles >= limita) {
    return { error: t("errorMaxCvs", { max: limita }) };
  }

  let fisierNume: string;
  try {
    fisierNume = await saveCvFile(userId, cvFile);
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("errorCvUpload") };
  }

  await prisma.cvFile.create({
    data: { candidateId: candidate.id, eticheta, fisierNume },
  });

  revalidatePath("/setari");
  return { success: true };
}

export async function deleteCvAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") return;

  const cvId = String(formData.get("cvId") || "");
  if (!cvId) return;

  const cv = await prisma.cvFile.findUnique({
    where: { id: cvId },
    include: { candidate: true },
  });
  if (!cv || cv.candidate.userId !== session.user.id) return;

  await prisma.cvFile.delete({ where: { id: cvId } });

  try {
    await unlink(path.join(process.cwd(), "uploads", "cv", cv.fisierNume));
  } catch {
    // fișierul poate fi deja lipsă - nu blocăm ștergerea înregistrării
  }

  revalidatePath("/setari");
}

export async function updateCandidateProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("candidate");
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return { error: t("errorMustBeCandidate") };
  }
  const userId = session.user.id;

  const profileSchema = z.object({
    numeComplet: z.string().trim().min(2, t("errorFullNameRequired")),
    locatie: z.string().trim().min(2, t("errorLocationRequired")),
    remote: z.boolean(),
    aniExperienta: z.coerce.number().int().min(0).max(60),
    titluCurent: z.string().trim().min(2, t("errorTitleRequired")),
    bio: z.string().trim().optional(),
    disponibilitate: z.enum(["IMEDIATA", "SUB_O_LUNA", "PESTE_O_LUNA"]),
  });

  const parsed = profileSchema.safeParse({
    numeComplet: formData.get("numeComplet"),
    locatie: formData.get("locatie"),
    remote: formData.get("remote") === "on",
    aniExperienta: formData.get("aniExperienta"),
    titluCurent: formData.get("titluCurent"),
    bio: formData.get("bio") || undefined,
    disponibilitate: formData.get("disponibilitate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errorInvalidData") };
  }

  const salariuMinim = parseOptionalInt(formData.get("salariuMinim"));
  const salariuMaxim = parseOptionalInt(formData.get("salariuMaxim"));
  if (salariuMinim !== undefined && salariuMaxim !== undefined && salariuMinim > salariuMaxim) {
    return { error: t("errorSalaryRange") };
  }

  const skillNames = parseSkills(formData.get("skills"));

  // data nașterii (opțională) — dacă e completată, derivăm vârsta din ea
  const dataNasteriiRaw = String(formData.get("dataNasterii") || "").trim();
  const dataNasteriiDate = dataNasteriiRaw ? new Date(dataNasteriiRaw) : null;
  const dataNasterii =
    dataNasteriiDate && !Number.isNaN(dataNasteriiDate.getTime()) ? dataNasteriiDate : null;
  const varsta = dataNasterii ? calculeazaVarsta(dataNasterii) : null;

  const sexRaw = String(formData.get("sex") || "").trim();
  const sex = SEXE_PERMISE.includes(sexRaw) ? sexRaw : null;

  // Studii (opțional). Dacă e ales un nivel, restul câmpurilor se rețin, iar statusul
  // implicit e „finalizate". Fără nivel, se golesc toate câmpurile de studii.
  const nivelValues = Object.values(StudiiNivel) as string[];
  const statusValues = Object.values(StudiiStatus) as string[];
  const studiiNivelRaw = String(formData.get("studiiNivel") || "").trim();
  const studiiNivel = nivelValues.includes(studiiNivelRaw)
    ? (studiiNivelRaw as StudiiNivel)
    : null;

  let studiiStatus: StudiiStatus | null = null;
  let studiiSpecializare: string | null = null;
  let studiiInstitutie: string | null = null;
  let studiiAn: number | null = null;
  if (studiiNivel) {
    const statusRaw = String(formData.get("studiiStatus") || "").trim();
    studiiStatus = statusValues.includes(statusRaw)
      ? (statusRaw as StudiiStatus)
      : StudiiStatus.FINALIZAT;
    studiiSpecializare = String(formData.get("studiiSpecializare") || "").trim() || null;
    studiiInstitutie = String(formData.get("studiiInstitutie") || "").trim() || null;
    const anParsed = parseOptionalInt(formData.get("studiiAn"));
    const anCurent = new Date().getFullYear();
    studiiAn =
      anParsed !== undefined && anParsed >= 1950 && anParsed <= anCurent + 10 ? anParsed : null;
  }

  let pozaFisier: string | null | undefined; // undefined = păstrează, null = șterge
  const poza = formData.get("poza");
  if (poza instanceof File && poza.size > 0) {
    // schimbă poza (upload nou)
    try {
      pozaFisier = await savePozaFile(userId, poza);
    } catch (e) {
      return { error: e instanceof Error ? e.message : t("errorPhotoUpload") };
    }
  } else if (formData.get("stergePoza") === "on") {
    // șterge poza existentă (fișier + referință)
    const existent = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { pozaFisier: true },
    });
    if (existent?.pozaFisier) {
      try {
        await unlink(path.join(process.cwd(), "uploads", "poze", existent.pozaFisier));
      } catch {
        // fișierul poate lipsi deja
      }
    }
    pozaFisier = null;
  }

  await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        numeComplet: parsed.data.numeComplet,
        locatie: parsed.data.locatie,
        remote: parsed.data.remote,
        aniExperienta: parsed.data.aniExperienta,
        titluCurent: parsed.data.titluCurent,
        bio: parsed.data.bio,
        disponibilitate: parsed.data.disponibilitate,
        salariuMinim,
        salariuMaxim,
        varsta,
        dataNasterii,
        sex,
        studiiNivel,
        studiiSpecializare,
        studiiInstitutie,
        studiiAn,
        studiiStatus,
        pozaFisier,
      },
      update: {
        numeComplet: parsed.data.numeComplet,
        locatie: parsed.data.locatie,
        remote: parsed.data.remote,
        aniExperienta: parsed.data.aniExperienta,
        titluCurent: parsed.data.titluCurent,
        bio: parsed.data.bio,
        disponibilitate: parsed.data.disponibilitate,
        salariuMinim,
        salariuMaxim,
        varsta,
        dataNasterii,
        sex,
        studiiNivel,
        studiiSpecializare,
        studiiInstitutie,
        studiiAn,
        studiiStatus,
        pozaFisier,
      },
    });

    for (const nume of skillNames) {
      await tx.skill.upsert({ where: { nume }, create: { nume }, update: {} });
    }
    const skillRecords = await tx.skill.findMany({ where: { nume: { in: skillNames } } });

    await tx.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
    if (skillRecords.length > 0) {
      await tx.candidateSkill.createMany({
        data: skillRecords.map((s) => ({ candidateId: candidate.id, skillId: s.id })),
      });
    }
  });

  // după salvare, ducem candidatul direct la pagina „Profilul meu" cu datele noi
  revalidatePath("/candidat/profil");
  redirect("/candidat/profil");
}
