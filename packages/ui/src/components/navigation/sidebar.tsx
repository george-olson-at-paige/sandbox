"use client"

import type { ComponentProps } from "react"
import type { ComponentType, ElementType, ReactNode } from "react"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../../base/sidebar"

/* @archetype Frame (ARCHETYPES.md).
   Paige Sidebar over upstream Sidebar (R8-07): a side nav given as data: sections (an optional
   label each), items with an icon, an optional badge and the active item. What the Paige layer
   narrows: one variant (the rail, full height, a border), collapsing to icons only (`collapsible`
   "icon": the labels become tooltips; Ctrl/Cmd+B and the rail edge toggle it, and the state is
   kept in upstream's cookie), the phone form is upstream's sheet (below 768), and links come
   from the app's router (`linkAs`, GAPS #42). The active item is the accent (blue tint, blue
   ink: the --sidebar-* roles in theme.css, 4.5:1) with aria-current="page"; other items hover with the
   relative layer (R4-01), not a fixed colour.
   SidebarLayout is the provider and the inset the page sits in (the template uses it); a page
   never assembles the upstream pieces. SidebarToggle is the button that opens or collapses it,
   for the page's top bar.
   Collapse control (R10-06): `collapseControl` puts the toggle in the footer (icon + "Collapse";
   icon only when collapsed, "Expand" in a tooltip), Ctrl/Cmd+B still works; hidden on a phone,
   where the sheet closes on its own. `rail={false}` drops upstream's SidebarRail (R10-07), the
   thin edge strip that toggles on click and shows a resize cursor: a plain edge, the default
   cursor, nothing to resize. The admin sidebar uses both; resizing is for drawers later.
   The nav scrolls with the theme's thin scrollbar (R10-08).
   Upstream's floating/inset variants, sub-menus, group actions, menu actions and the search
   input are not exposed until a screen needs them. */

type SidebarIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>

/** One destination in the nav. */
type SidebarItem = {
  id: string
  label: string
  href: string
  /** A lucide icon (or any icon component); shown alone when the nav is collapsed. */
  icon: SidebarIcon
  /** A short count or status after the label ("3", "New"). */
  badge?: string
}

/** A group of items with an optional label. */
type SidebarSection = { id: string; label?: string; items: SidebarItem[] }

/** A side nav from data: labelled sections, items with icons, the active item; collapses to an icon rail and becomes a sheet on phones. */
function Sidebar({
  sections,
  activeId,
  header,
  footer,
  linkAs: Link = "a",
  label = "Main",
  collapseControl = false,
  rail = true,
  className,
}: {
  /** The nav, in order. */
  sections: SidebarSection[]
  /** The id of the current page's item. */
  activeId?: string
  /** Above the nav: the product mark. Keep it to one row; it is hidden behind the icon in the rail. */
  header?: ReactNode
  /** Below the nav: the signed-in person, a help link. */
  footer?: ReactNode
  /** The app's router link (next/link); default a plain <a>. */
  linkAs?: ElementType
  /** The nav landmark's name. */
  label?: string
  /** The collapse toggle in the footer (R10-06); Ctrl/Cmd+B works either way. */
  collapseControl?: boolean
  /** Upstream's rail on the edge (toggles on click, resize cursor). Default true; false for a plain edge (R10-07). */
  rail?: boolean
  className?: string
}) {
  return (
    <UiSidebar collapsible="icon" className={className}>
      {header && <SidebarHeader className="h-bar justify-center border-b border-sidebar-border px-3">{header}</SidebarHeader>}
      <SidebarContent className="scrollbar-thin">
        <nav aria-label={label}>
          {sections.map((section) => (
            <SidebarGroup key={section.id}>
              {section.label && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = item.id === activeId
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "cursor-pointer hover:bg-transparent hover:text-sidebar-foreground hover:layer-hover active:bg-transparent active:text-sidebar-foreground active:layer-press",
                            "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <Link href={item.href} aria-current={active ? "page" : undefined}>
                            <Icon aria-hidden />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      {(footer || collapseControl) && (
        <SidebarFooter className="border-t border-sidebar-border">
          {footer}
          {collapseControl && <CollapseControl />}
        </SidebarFooter>
      )}
      {rail && <SidebarRail />}
    </UiSidebar>
  )
}

/* Every sidebar control shows the pointer (R13-11): the collapse control and the top bar's toggle
   are <button>s, which the preflight gives the default cursor; the nav links say it too. */

/** The footer's collapse toggle (R10-06): a menu button like the nav's, so it lines up with the items and keeps the icon in the rail. */
function CollapseControl() {
  const { state, isMobile, toggleSidebar } = useSidebar()
  if (isMobile) return null
  const collapsed = state === "collapsed"
  const Icon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Expand"
          onClick={toggleSidebar}
          aria-keyshortcuts="Control+B Meta+B"
          data-slot="sidebar-collapse"
          className="cursor-pointer text-muted-foreground hover:bg-transparent hover:text-sidebar-foreground hover:layer-hover active:bg-transparent active:layer-press"
        >
          <Icon aria-hidden />
          {/* One word that says what a click does; hidden in the rail, where the tooltip says it. */}
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/** The frame a sidebar page sits in: the sidebar beside an inset that holds the page (used by AdminPage). */
function SidebarLayout({
  sidebar,
  defaultOpen = true,
  children,
}: {
  /** A <Sidebar>. */
  sidebar: ReactNode
  /** Start expanded (default) or as the icon rail. */
  defaultOpen?: boolean
  /** The page: top bar and content. Rendered in the inset, which is the page's <main>. */
  children: ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {sidebar}
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}

/** The button that collapses the sidebar to icons (or opens the sheet on a phone), for the page's top bar. */
function SidebarToggle({ className }: { className?: string }) {
  return <SidebarTrigger className={cn("size-control-sm cursor-pointer rounded-full hover:bg-transparent hover:layer-hover", className)} />
}

export { Sidebar, SidebarLayout, SidebarToggle }
export type { SidebarIcon, SidebarItem, SidebarSection }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SidebarProps = ComponentProps<typeof Sidebar>
export type SidebarLayoutProps = ComponentProps<typeof SidebarLayout>
export type SidebarToggleProps = ComponentProps<typeof SidebarToggle>
