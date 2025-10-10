export const Testimonial = () => {
  return (
    <section className="padding-global">
      <div className="padding-section-medium container">
        <div className="text-foreground mb-10 text-xl md:text-2xl lg:text-4xl">
          <span className="text-foreground/70">
            Working with Cloviana has felt more like having an in-house team
            than a platform. They move fast, listen to feedback, and ship
            improvements before we even ask twice.
          </span>{' '}
          Partnering with them has made SEO something we no longer worry about —
          it just works.
        </div>
        <div className="flex flex-col gap-y-2">
          <img
            src="/signatures/casper-signature.png"
            alt="Casper signature"
            className="w-82"
          />
          <span className="text-foreground/50 text-lg">Founder, Casper</span>
        </div>
      </div>
    </section>
  );
};
