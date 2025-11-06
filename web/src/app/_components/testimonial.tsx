export const Testimonial = () => {
  return (
    <section className="padding-global">
      <div className="padding-section-small container flex flex-col items-center">
        <div className="text-foreground mb-6 text-center text-base md:text-2xl lg:text-4xl">
          <span className="text-foreground/70">
            Cloviana feels less like a tool and more like our in-house growth
            team — fast, responsive, and always improving how we show up online.
          </span>{' '}
          Organic growth finally runs on autopilot.
        </div>
        <div className="flex flex-col items-center gap-y-3">
          <span className="text-foreground/50 text-lg">Founder, Casper</span>

          <img
            src="/signatures/casper-signature.png"
            alt="Casper signature"
            className="w-62 md:w-82"
          />
        </div>
      </div>
    </section>
  );
};
