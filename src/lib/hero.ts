// Pool de "slide-uri" pentru hero-ul paginii principale: fiecare are o imagine
// realistă + un slogan (cheie i18n). Se alege unul aleator la fiecare vizită/logare,
// așa că mesajul și imaginea se schimbă de fiecare dată.

export type HeroSlide = {
  image: string;
  sloganKey: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  { image: "/images/hero-team.jpg", sloganKey: "s1" },
  { image: "/images/hero-success.jpg", sloganKey: "s2" },
  { image: "/images/hero-factory.jpg", sloganKey: "s3" },
  { image: "/images/hero-engineer.jpg", sloganKey: "s4" },
  { image: "/images/hero-office.jpg", sloganKey: "s5" },
  { image: "/images/hero-meeting.jpg", sloganKey: "s6" },
  { image: "/images/hero-welder.jpg", sloganKey: "s7" },
  { image: "/images/hero-collab.jpg", sloganKey: "s8" },
];

export function alegeSlideAleator(): HeroSlide {
  return HERO_SLIDES[Math.floor(Math.random() * HERO_SLIDES.length)];
}
