import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface SubMenuItem {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SubMenu {
  title: string;
  items: SubMenuItem[];
}

export interface NavItem {
  id: number;
  label: string;
  subMenus?: SubMenu[];
  link?: string;
}

export interface Props {
  navItems: NavItem[];
}

export function DropdownNavigation({ navItems }: Props) {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  const handleHover = (menuLabel: string | null) => {
    setOpenMenu(menuLabel);
  };

  const [isHover, setIsHover] = useState<number | null>(null);
  return (
    <ul className="relative flex items-center space-x-0">
      {navItems.map((navItem) => (
        <li
          key={navItem.label}
          className="relative"
          onMouseEnter={() => handleHover(navItem.label)}
          onMouseLeave={() => handleHover(null)}
        >
          {navItem.link ? (
            <a
              href={navItem.link}
              className="text-sm py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-muted-foreground hover:text-foreground relative uppercase tracking-wider font-bold"
            >
              <span>{navItem.label}</span>
            </a>
          ) : (
            <button
              className="text-sm py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-muted-foreground hover:text-foreground relative uppercase tracking-wider font-bold"
              onMouseEnter={() => setIsHover(navItem.id)}
              onMouseLeave={() => setIsHover(null)}
            >
              <span>{navItem.label}</span>
              {navItem.subMenus && (
                <ChevronDown
                  className={`h-4 w-4 group-hover:rotate-180 duration-300 transition-transform
                    ${openMenu === navItem.label ? "rotate-180" : ""}`}
                />
              )}
              {(isHover === navItem.id || openMenu === navItem.label) && (
                <motion.div
                  layoutId="hover-bg"
                  className="absolute inset-0 size-full bg-foreground/5"
                  style={{ borderRadius: 0 }} // Match strict flat B&W design (no radius)
                />
              )}
            </button>
          )}

          <AnimatePresence>
            {openMenu === navItem.label && navItem.subMenus && (
              <div className="w-auto absolute left-0 top-full pt-2 z-50">
                <motion.div
                  className="bg-background border border-border p-5 w-max shadow-xl rounded-none" // Match strict flat B&W design (no radius)
                  layoutId="menu"
                >
                  <div className={navItem.subMenus.length > 4 ? "grid grid-cols-5 gap-x-8 gap-y-8 w-[980px] shrink-0" : "w-fit shrink-0 flex space-x-9 overflow-hidden"}>
                    {navItem.subMenus.map((subMenu) => (
                      <div className="w-full" key={subMenu.title}>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {subMenu.title}
                        </h3>
                        <ul className="space-y-4">
                          {subMenu.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <li key={item.label}>
                                <a
                                  href="#"
                                  className="flex items-start space-x-3 group"
                                >
                                  <div className="border border-border text-foreground rounded-none flex items-center justify-center size-9 shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
                                    <Icon className="h-4 w-4 flex-none" />
                                  </div>
                                  <div className="leading-tight flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                                      {item.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200 mt-0.5">
                                      {item.description}
                                    </p>
                                  </div>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}
