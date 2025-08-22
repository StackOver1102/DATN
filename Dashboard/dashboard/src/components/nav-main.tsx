"use client";

import { useState } from "react";
import { type Icon } from "@tabler/icons-react";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    isActive?: boolean;
    notifications?: number;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  // Initialize expanded state based on active items
  const initialExpandedState: Record<string, boolean> = {};
  items.forEach(item => {
    // Auto-expand items that are active or have active children
    if (item.isActive && item.items && item.items.length > 0) {
      initialExpandedState[item.title] = true;
    }
  });

  // State to track which menu items are expanded
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(initialExpandedState);

  // Toggle expansion state for a menu item
  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu> */}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.items && item.items.length > 0 ? (
                // For items with submenu, use a button to toggle expansion
                <div className="flex flex-col">
                  <div 
                    className={`flex items-center px-2 py-2 rounded-md cursor-pointer ${
                      item.isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    }`}
                    onClick={() => toggleExpand(item.title)}
                  >
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    <span className="flex-grow">{item.title}</span>
                    {item.notifications && item.notifications > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white mr-2">
                        {item.notifications}
                      </span>
                    )}
                    {expandedItems[item.title] ? (
                      <IconChevronDown className="h-4 w-4" />
                    ) : (
                      <IconChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  
                  {/* Render submenu items if expanded */}
                  {expandedItems[item.title] && (
                    <SidebarMenu className="ml-6 mt-1">
                      {item.items.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={subItem.title}
                            className="text-sm"
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </div>
              ) : (
                // For regular items without submenu
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={item.isActive}
                  className={
                    item.isActive ? "bg-accent text-accent-foreground" : ""
                  }
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.notifications && item.notifications > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                        {item.notifications}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
