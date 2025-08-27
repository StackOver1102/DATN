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
  IconSettings,
  IconUsers,
  IconCoin,
  IconPhoto,
  IconMessageCircle,
} from "@tabler/icons-react";
import { useNotifications } from "@/lib/hooks/useNotifications";

import { NavMain } from "@/components/nav-main";
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
      // notifications: 3,
    },
    {
      title: "Support",
      url: "/dashboard/support",
      icon: IconHelp,
      // notifications: 5,
    },
    {
      title: "Banners",
      url: "/dashboard/banner",
      icon: IconPhoto,
    },
    {
      title: "Content",
      url: "/dashboard/master-data",
      icon: IconFileDescription,
    },
    {
      title: "Comments",
      url: "/dashboard/comment",
      icon: IconMessageCircle,
    },
    {
        title: "Category",
        url: "/dashboard/categories",
        icon: IconSettings,
        items: [
          {
            title: "Categories",
            url: "/dashboard/categories",
          },
          {
            title: "Sub Categories",
            url: "/dashboard/categories/sub-categories",
          }
        ],
    }
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
  ],
  documents: [
    {
      name: "Refunds",
      url: "/dashboard/refunds",
      icon: IconCoin,
      // notifications: 3,
    },
    {
      name: "Support",
      url: "/dashboard/support",
      icon: IconHelp,
      // notifications: 5,
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
  // Use Next.js pathname hook to detect current path
  const pathname = usePathname();

  // Get notification counts
  const { counts } = useNotifications();

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
    // data?.navSecondary?.forEach((item, index) => {
    //   if (isPathActive(item.url, pathname)) {
    //     const specificity = item.url.length;
    //     if (specificity > bestMatch.specificity) {
    //       bestMatch = { type: "secondary", index, url: item.url, specificity };
    //     }
    //   }
    // });

    return bestMatch;
  };

  const bestMatch = findBestMatch();

  // Update navMain items with isActive property and dynamic notifications
  const navMainWithActive = data.navMain.map((item, index) => {
    // Add dynamic notification counts based on item title
    let notifications: number | undefined = undefined;
    if (item.title === "Support") {
      notifications = counts.support || undefined;
    } else if (item.title === "Refunds") {
      notifications = counts.refund || undefined;
    }
    else if(item.title === "Comments"){
      notifications = counts.comment || undefined;
    }

    // Check if current path matches this item or any of its subitems
    let isActive = bestMatch.type === "main" && bestMatch.index === index;
    
    // Also check subitems if they exist
    if (!isActive && item.items && item.items.length > 0) {
      isActive = item.items.some(subItem => isPathActive(subItem.url, pathname));
    }

    return {
      ...item,
      isActive,
      notifications,
    };
  });

  // We can implement nested navigation in the future if needed
  // For now, we're using the flat navigation structure

  // Update secondary nav items with isActive property
  // const secondaryWithActive = data.navSecondary.map((item, index) => ({
  //   ...item,
  //   isActive: bestMatch.type === "secondary" && bestMatch.index === index,
  // }));

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
                <span className="text-base font-semibold">3DVN Models Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        {/* <NavSecondary items={secondaryWithActive} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
