import { Zap } from "lucide-react";
import { FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";

export function Footer() {
  const footerLinks = {
    product: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Roadmap", href: "#" }
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" }
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Community", href: "#" },
      { name: "API", href: "#" }
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Security", href: "#" },
      { name: "Cookies", href: "#" }
    ]
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          
          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">© 2024 incubator.ai. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-twitter"
              aria-label="Twitter"
            >
              <FaTwitter className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-linkedin"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-github"
              aria-label="GitHub"
            >
              <FaGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
