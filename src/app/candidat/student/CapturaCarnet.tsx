"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LATIME_MAX = 1600; // poza se redimensionează înainte de trimitere

type Pas = "start" | "camera" | "previzualizare" | "trimite";

export default function CapturaCarnet() {
  const t = useTranslations("student");
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pas, setPas] = useState<Pas>("start");
  const [poza, setPoza] = useState<Blob | null>(null);
  const [previzualizare, setPrevizualizare] = useState<string | null>(null);
  const [tipDocument, setTipDocument] = useState("LEGITIMATIE_STUDENT");
  const [institutie, setInstitutie] = useState("");
  const [declaratie18, setDeclaratie18] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  function opresteCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  // Camera rămâne pornită doar cât e nevoie: se oprește la ieșirea din pagină.
  useEffect(() => opresteCamera, []);

  useEffect(() => {
    return () => {
      if (previzualizare) URL.revokeObjectURL(previzualizare);
    };
  }, [previzualizare]);

  async function pornesteCamera() {
    setEroare(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setPas("camera");
      // videoRef există abia după re-render, deci atașăm stream-ul în microtask.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch {
      // Refuz de permisiune, lipsă de cameră, sau context non-HTTPS.
      setEroare(t("errors.camera"));
      fileInputRef.current?.click();
    }
  }

  function seteazaPoza(blob: Blob) {
    if (previzualizare) URL.revokeObjectURL(previzualizare);
    setPoza(blob);
    setPrevizualizare(URL.createObjectURL(blob));
    setPas("previzualizare");
  }

  function fotografiaza() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scala = Math.min(1, LATIME_MAX / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scala);
    canvas.height = Math.round(video.videoHeight * scala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        opresteCamera();
        seteazaPoza(blob);
      },
      "image/jpeg",
      0.85
    );
  }

  function dinFisier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setEroare(null);
    seteazaPoza(f);
  }

  function reia() {
    if (previzualizare) URL.revokeObjectURL(previzualizare);
    setPoza(null);
    setPrevizualizare(null);
    setPas("start");
  }

  async function trimite() {
    if (!poza || !declaratie18) return;
    setPas("trimite");
    setEroare(null);

    const fd = new FormData();
    fd.set("poza", poza, "legitimatie.jpg");
    fd.set("tipDocument", tipDocument);
    fd.set("institutie", institutie.trim());
    fd.set("declaratie18", "on");

    const res = await fetch("/api/student/verificare", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setEroare(data?.error ?? t("errors.upload"));
      setPas("previzualizare");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("form.docType")}</span>
        <select
          value={tipDocument}
          onChange={(e) => setTipDocument(e.target.value)}
          className="input"
        >
          <option value="LEGITIMATIE_STUDENT">{t("form.docStudent")}</option>
          <option value="CARNET_ELEV">{t("form.docPupil")}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("form.institution")}</span>
        <input
          value={institutie}
          onChange={(e) => setInstitutie(e.target.value)}
          placeholder={t("form.institutionPlaceholder")}
          className="input"
        />
      </label>

      <div className="rounded-lg border border-line bg-surface/60 p-4">
        {pas === "start" && (
          <>
            <p className="text-sm text-muted">{t("capture.intro")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={pornesteCamera} className="btn-primary">
                {t("capture.openCamera")}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                {t("capture.chooseFile")}
              </button>
            </div>
          </>
        )}

        {pas === "camera" && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full rounded-lg border border-line bg-black"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={fotografiaza} className="btn-primary">
                {t("capture.take")}
              </button>
              <button
                type="button"
                onClick={() => {
                  opresteCamera();
                  setPas("start");
                }}
                className="btn-secondary"
              >
                {t("capture.cancel")}
              </button>
            </div>
          </>
        )}

        {(pas === "previzualizare" || pas === "trimite") && previzualizare && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previzualizare}
              alt={t("capture.previewAlt")}
              className="w-full rounded-lg border border-line"
            />
            <p className="mt-2 text-sm text-muted">{t("capture.checkReadable")}</p>
            <button
              type="button"
              onClick={reia}
              disabled={pas === "trimite"}
              className="btn-secondary mt-3 disabled:opacity-60"
            >
              {t("capture.retake")}
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={dinFisier}
          className="hidden"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={declaratie18}
          onChange={(e) => setDeclaratie18(e.target.checked)}
          className="mt-1 accent-accent"
        />
        <span>{t("form.declare18")}</span>
      </label>

      {eroare && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {eroare}
        </p>
      )}

      <button
        type="button"
        onClick={trimite}
        disabled={!poza || !declaratie18 || pas === "trimite"}
        className="btn-primary disabled:opacity-60"
      >
        {pas === "trimite" ? t("form.sending") : t("form.submit")}
      </button>

      <p className="text-xs text-muted">{t("form.privacyNote")}</p>
    </div>
  );
}
