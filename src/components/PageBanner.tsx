export default function PageBanner({
  image,
  title,
  titleBadge,
  subtitle,
  eyebrow,
  maxWidthClass = "max-w-3xl",
  children,
}: {
  image: string;
  title: string;
  titleBadge?: React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  maxWidthClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(105deg, rgba(4,35,26,0.94) 0%, rgba(6,40,30,0.84) 45%, rgba(15,23,42,0.6) 100%)",
        }}
      />
      <div className={`mx-auto w-full ${maxWidthClass} px-6 py-12`}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {eyebrow}
          </span>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          {titleBadge}
        </div>
        {subtitle && <p className="mt-2 max-w-xl text-white/85">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}
