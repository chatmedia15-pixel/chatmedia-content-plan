import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ContentIdeasPage } from "@/pages/content-ideas/ContentIdeasPage";
import { PlanningPage } from "@/pages/planning/PlanningPage";
import { CalendarPage } from "@/pages/calendar/CalendarPage";
import { PublishedPage } from "@/pages/published/PublishedPage";
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";
import { InsightsPage } from "@/pages/ai-insights/InsightsPage";
import { AssistantPage } from "@/pages/marketing-assistant/AssistantPage";
import { ContentCheckPage } from "@/pages/content-check/ContentCheckPage";
import { ExperimentsPage } from "@/pages/experiments/ExperimentsPage";
import { CompetitorsPage } from "@/pages/competitors/CompetitorsPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/beranda" replace /> },
      { path: "beranda", element: <DashboardPage /> },

      { path: "analitik", element: <AnalyticsPage /> },
      { path: "insight", element: <InsightsPage /> },

      { path: "ide", element: <ContentIdeasPage /> },
      { path: "rencana", element: <PlanningPage /> },
      { path: "kalender", element: <CalendarPage /> },
      { path: "dipublikasi", element: <PublishedPage /> },

      { path: "asisten", element: <AssistantPage /> },
      { path: "cek", element: <ContentCheckPage /> },
      { path: "lab", element: <ExperimentsPage /> },
      { path: "kompetitor", element: <CompetitorsPage /> },
      { path: "laporan", element: <ReportsPage /> },
      { path: "pengaturan", element: <SettingsPage /> },

      { path: "*", element: <Navigate to="/beranda" replace /> },
    ],
  },
]);
