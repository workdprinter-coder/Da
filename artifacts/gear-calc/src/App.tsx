import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalculatorProvider } from "@/context/calculator-context";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import SpurGearPage from "@/pages/spur-gear";
import HelicalGearPage from "@/pages/helical-gear";
import WormGearPage from "@/pages/worm-gear";
import SpiralBevelPage from "@/pages/spiral-bevel";
import MaterialsPage from "@/pages/materials";
import ToolsPage from "@/pages/tools";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/spur-gear" component={SpurGearPage} />
        <Route path="/helical-gear" component={HelicalGearPage} />
        <Route path="/worm-gear" component={WormGearPage} />
        <Route path="/spiral-bevel" component={SpiralBevelPage} />
        <Route path="/materials" component={MaterialsPage} />
        <Route path="/tools" component={ToolsPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalculatorProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CalculatorProvider>
    </QueryClientProvider>
  );
}

export default App;
