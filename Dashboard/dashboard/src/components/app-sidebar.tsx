"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCoin,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconDatabase,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconUsers,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconFileDescription,
    },
    // {
    //   title: "Categories",
    //   url: "/dashboard/categories",
    //   icon: IconListDetails,
    // },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: IconChartBar,
    },
    {
      title: "Refunds",
      url: "/dashboard/refunds",
      icon: IconCoin,
    },
    {
      title: "Support",
      url: "/dashboard/support",
      icon: IconHelp,
    },
    {
      title: "Master Data",
      url: "/dashboard/master-data",
      icon: IconDatabase,
    },
  ],
  navClouds: [
    {
      title: "Products",
      icon: IconDatabase,
      isActive: true,
      url: "/dashboard/products",
      items: [
        {
          title: "All Products",
          url: "/dashboard/products",
        },
        {
          title: "Add Product",
          url: "/dashboard/products/create",
        },
      ],
    },
    {
      title: "Users",
      icon: IconUsers,
      url: "/dashboard/users",
      items: [
        {
          title: "All Users",
          url: "/dashboard/users",
        },
        {
          title: "Add User",
          url: "/dashboard/users/create",
        },
      ],
    },
    {
      title: "Orders",
      icon: IconFileDescription,
      url: "/dashboard/orders",
      items: [
        {
          title: "All Orders",
          url: "/dashboard/orders",
        },
        {
          title: "Pending Orders",
          url: "/dashboard/orders?status=pending",
        },
        {
          title: "Completed Orders",
          url: "/dashboard/orders?status=completed",
        },
      ],
    },
    {
      title: "Refunds",
      icon: IconCoin,
      url: "/dashboard/refunds",
      items: [
        {
          title: "All Refunds",
          url: "/dashboard/refunds",
        },
        {
          title: "Pending Refunds",
          url: "/dashboard/refunds?status=pending",
        },
        {
          title: "Completed Refunds",
          url: "/dashboard/refunds?status=completed",
        },
      ],
    },
    {
      title: "Support",
      icon: IconHelp,
      url: "/dashboard/support",
      items: [
        {
          title: "All Support",
          url: "/dashboard/support",
        },
        {
          title: "Pending Support",
          url: "/dashboard/support?status=pending",
        },
        {
          title: "Resolved Support",
          url: "/dashboard/support?status=resolved",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    // Removed Support from here as it's now in the main nav
    {
      title: "Search",
      url: "/dashboard/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Refunds",
      url: "/dashboard/refunds",
      icon: IconCoin,
    },
    {
      name: "Support",
      url: "/dashboard/support",
      icon: IconHelp,
    },
    // {
    //   name: "Comments",
    //   url: "/dashboard/comments",
    //   icon: IconFileWord,
    // },
    // {
    //   name: "Media",
    //   url: "/dashboard/media",
    //   icon: IconCamera,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Use Next.js usePathname hook to detect current path
  const pathname = usePathname();

  // Helper function to check if a path matches a menu item URL
  const isPathActive = (itemUrl: string, currentPath: string) => {
    // usePathname() already returns a normalized path without hostname and port
    // We just need to handle the comparison correctly

    // Exact match
    if (currentPath === itemUrl) return true;

    // Check if path is a sub-path of the item URL (e.g. /dashboard/products/123 should match /dashboard/products)
    if (itemUrl !== "/" && currentPath.startsWith(`${itemUrl}/`)) return true;

    // Handle query parameters (e.g. /dashboard/orders?status=pending should match /dashboard/orders)
    if (currentPath.split("?")[0] === itemUrl) return true;

    return false;
  };

  // Find the most specific match for the current path
  const findBestMatch = () => {
    // First check for exact matches
    let bestMatch = {
      type: null as "main" | "documents" | "secondary" | null,
      index: -1,
      url: "",
      specificity: 0, // Higher is more specific
    };

    // Check main navigation
    data.navMain.forEach((item, index) => {
      if (isPathActive(item.url, pathname)) {
        // Calculate specificity - longer URLs are more specific
        const specificity = item.url.length;
        if (specificity > bestMatch.specificity) {
          bestMatch = { type: "main", index, url: item.url, specificity };
        }
      }
    });

    // Check documents
    data.documents.forEach((item, index) => {
      if (isPathActive(item.url, pathname)) {
        const specificity = item.url.length;
        if (specificity > bestMatch.specificity) {
          bestMatch = { type: "documents", index, url: item.url, specificity };
        }
      }
    });

    // Check secondary navigation
    data.navSecondary.forEach((item, index) => {
      if (isPathActive(item.url, pathname)) {
        const specificity = item.url.length;
        if (specificity > bestMatch.specificity) {
          bestMatch = { type: "secondary", index, url: item.url, specificity };
        }
      }
    });

    return bestMatch;
  };

  const bestMatch = findBestMatch();

  // Update navMain items with isActive property
  const navMainWithActive = data.navMain.map((item, index) => ({
    ...item,
    isActive: bestMatch.type === "main" && bestMatch.index === index,
  }));

  // We can implement nested navigation in the future if needed
  // For now, we're using the flat navigation structure

  // Update documents items with isActive property
  const documentsWithActive = data.documents.map((item, index) => ({
    ...item,
    isActive: bestMatch.type === "documents" && bestMatch.index === index,
  }));

  // Update secondary nav items with isActive property
  const secondaryWithActive = data.navSecondary.map((item, index) => ({
    ...item,
    isActive: bestMatch.type === "secondary" && bestMatch.index === index,
  }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">3D Models Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavSecondary items={secondaryWithActive} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
