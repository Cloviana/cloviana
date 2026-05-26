import { cn } from '@/utils/cn';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <section className={cn(className)}>
      <div className="container">
        <div className="flex flex-col gap-10 py-12 lg:flex-row lg:justify-between">
          {/* Logo — mobile/tablet only */}
          <a href="/" className="lg:hidden">
            <img src="/logo-full.png" alt="Cloviana" className="h-5" />
          </a>

          {/* Link columns — below logo on mobile, right on desktop */}
          <div className="flex shrink-0 gap-16 lg:order-last">
            <div>
              <p className="text-muted-foreground mb-4 text-sm">Cloviana</p>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <a href="/audits" className="hover:text-primary">
                    Free Audit
                  </a>
                </li>
                <li>
                  <a
                    href="https://calendly.com/cloviana/30min"
                    className="hover:text-primary"
                  >
                    Contact us
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/cloviana"
                    className="hover:text-primary"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground mb-4 text-sm">Legal</p>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <a
                    href="/regulations/privacy-policy"
                    className="hover:text-primary"
                  >
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Terms of use
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer text — below columns on mobile, left on desktop */}
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Cloviana provides AI-powered GEO technology designed to help B2B
            SaaS companies appear in AI-generated search results across
            platforms like ChatGPT, Perplexity, and Gemini. Cloviana is a
            software platform and does not provide sales, marketing, legal, or
            advisory services.
            <br />
            <br />
            Any visibility data, recommendations, or optimizations generated
            through Cloviana are based on publicly available information and the
            configuration provided by the customer. Cloviana does not control,
            verify, or guarantee the accuracy, completeness, or suitability of
            any information presented through its platform. By using this
            website or the Cloviana platform, you acknowledge that all content
            is provided for informational and operational purposes only and
            agree to our{' '}
            <a href="#" className="underline hover:opacity-70">
              Terms of Use
            </a>{' '}
            and{' '}
            <a
              href="/regulations/privacy-policy"
              className="underline hover:opacity-70"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="pb-20" />
      </div>
    </section>
  );
};

export { Footer };
