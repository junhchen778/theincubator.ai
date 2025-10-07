import { Zap, Mail, MapPin, Phone } from "lucide-react";
import { FaTwitter, FaLinkedin, FaGithub, FaProductHunt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <footer className="relative border-t border-border bg-gradient-to-br from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Top section with newsletter */}
        <div className="mb-12 pb-12 border-b border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  incubator.ai
                </span>
              </div>
              <p className="text-gray-600 max-w-md">
                Connecting founders and investors through transparent, real-time updates. 
                Join the future of venture capital.
              </p>
            </div>
            
            {/* Newsletter Signup */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Stay Updated
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get the latest news and exclusive updates
              </p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1"
                />
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-md">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main footer links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Product Column */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
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
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
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
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
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
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-primary transition-colors inline-block hover:translate-x-1 transition-transform"
                    data-testid={`link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span>San Francisco, CA</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span>hello@incubator.ai</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              © 2024 incubator.ai. All rights reserved.
            </span>
          </div>
          
          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              data-testid="link-twitter"
              aria-label="Twitter"
            >
              <FaTwitter className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              data-testid="link-linkedin"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              data-testid="link-github"
              aria-label="GitHub"
            >
              <FaGithub className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              aria-label="Product Hunt"
            >
              <FaProductHunt className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
