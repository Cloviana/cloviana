export const Testimonial = () => {
  return (
    <section className="padding-global">
      <div className="padding-section-medium container flex flex-col items-center">
        <div className="text-foreground mb-8 text-center text-xl md:text-2xl lg:text-4xl">
          <span className="text-foreground/70">
            Working with Cloviana has felt more like having an in-house growth
            team than using a tool. They move fast, listen to feedback, and keep
            improving how we show up online.
          </span>{' '}
          Partnering with them has made organic growth feel effortless — we can
          finally focus on the rest of the business.
        </div>
        <div className="flex flex-col items-center gap-y-3">
          <span className="text-foreground/50 text-lg">Founder, Casper</span>

          <img
            src="/signatures/casper-signature.png"
            alt="Casper signature"
            className="w-82"
          />
        </div>
      </div>
    </section>
  );
};
