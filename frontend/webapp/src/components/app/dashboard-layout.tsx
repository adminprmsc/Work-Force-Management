import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronsUpDown, LogOut, UserCircle } from "lucide-react";

import prmscLogo from "@/assets/prmsc-logo.png";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getNavGroupsForRole,
  getRouteMeta,
  isNavItemActive,
} from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { Role, roleToDashboardPath } from "@/modules/auth/roles";
import { useAuth } from "@/modules/auth/use-auth";

function getProfilePath(role: string): string | null {
  switch (role) {
    case Role.RA_ENVIRONMENT_HO:
    case Role.WORLD_BANK_USER:
    case Role.RA_ES_TEHSIL:
      return `${roleToDashboardPath(role as Role)}/profile`;
    default:
      return null;
  }
}

function userInitials(username: string): string {
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function DashboardLayout() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const user = auth.status === "authenticated" ? auth.user : null;
  const navGroups = user ? getNavGroupsForRole(user.role) : [];
  const meta = getRouteMeta(location.pathname);
  const profilePath = user ? getProfilePath(user.role) : null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border/60">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent ring-1 ring-sidebar-border/50">
                <img src={prmscLogo} alt="PRMSC" className="h-7 w-auto" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
                <div className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  ESMS
                </div>
                <div className="truncate text-[11px] text-sidebar-foreground/65">
                  Environment & Social Safeguard
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const peerPaths = group.items.map((entry) => entry.path)
                      const active = isNavItemActive(
                        location.pathname,
                        item.path,
                        peerPaths,
                      );
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.label}
                            className={cn(
                              active &&
                                "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                            )}
                          >
                            <Link to={item.path}>
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter className="border-t border-sidebar-border/60">
            {user ? (
              <div className="px-2 py-2 group-data-[collapsible=icon]/sidebar:hidden">
                <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
                  <div className="truncate text-xs font-medium text-sidebar-foreground">
                    {user.username}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-sidebar-foreground/60">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ??
                      user.role}
                  </div>
                </div>
              </div>
            ) : null}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    auth.signOut();
                    navigate("/login", { replace: true });
                  }}
                  tooltip="Sign out"
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="app-shell-bg">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />

            <div className="min-w-0 flex-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="truncate text-sm font-semibold tracking-tight">
                      {meta.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              {meta.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {meta.description}
                </p>
              ) : null}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 border-border/80 bg-background/60 pl-1.5 pr-2"
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {userInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">
                      {user.username}
                    </span>
                    <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {user.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <Badge
                        variant="secondary"
                        className="mt-1 w-fit text-[10px]"
                      >
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ??
                          user.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profilePath ? (
                    <DropdownMenuItem asChild>
                      <Link to={profilePath}>
                        <UserCircle className="size-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      auth.signOut();
                      navigate("/login", { replace: true });
                    }}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </header>

          <main className={cn("mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8")}>
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
