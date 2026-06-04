import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { useAuth } from "./AuthContext";

import { Badge } from "@/components/ui/badge";
import { Laugh, Meh, Frown, Info } from "lucide-react";

// Return badge classes and icon based on thresholds.
// Light mode: pale tinted background with a deep icon colour.
// Dark mode: saturated background with a white icon.
function getGradientAndIcon(value, { green, orange }, reverse = false) {
  if (reverse) {
    if (value >= orange) {
      return {
        badgeClass:
          "from-green-200 to-green-100 text-green-700 dark:from-green-500 dark:to-green-400 dark:text-white",
        Icon: Laugh,
      };
    }
    if (value >= green) {
      return {
        badgeClass:
          "from-orange-200 to-orange-100 text-orange-700 dark:from-orange-500 dark:to-orange-400 dark:text-white",
        Icon: Meh,
      };
    }
    return {
      badgeClass:
        "from-red-200 to-red-100 text-red-700 dark:from-red-600 dark:to-red-500 dark:text-white",
      Icon: Frown,
    };
  } else {
    if (value < green) {
      return {
        badgeClass:
          "from-green-200 to-green-100 text-green-700 dark:from-green-500 dark:to-green-400 dark:text-white",
        Icon: Laugh,
      };
    }
    if (value < orange) {
      return {
        badgeClass:
          "from-orange-200 to-orange-100 text-orange-700 dark:from-orange-500 dark:to-orange-400 dark:text-white",
        Icon: Meh,
      };
    }
    return {
      badgeClass:
        "from-red-200 to-red-100 text-red-700 dark:from-red-600 dark:to-red-500 dark:text-white",
      Icon: Frown,
    };
  }
}

export function SectionCards({ data }) {

  const { user, isPremium } = useAuth();

  const totalTrackers = data.reduce((sum, row) => sum + (row.trackers ?? 0), 0);
  const totalStoredData = data.reduce((sum, row) => sum + (row.stored_data_types ?? 0), 0);
  const totalWorkers = data.reduce((sum, row) => sum + (row.workers ?? 0), 0);
  const averageTrustScore =
    data.length > 0
      ? data.reduce((sum, row) => sum + (row.trust_score ?? 0), 0) / data.length
      : 1;

  const items = [
    {
      title: "Total Current Trackers",
      value: totalTrackers,
      ...getGradientAndIcon(totalTrackers, { green: 100, orange: 400 }),
      description: "Sum of all trackers across sites",
      tooltip: "The number of tracking tools found by our extension that you are yet to revoke (see the table below). Trackers often collect data about your activity for advertising or analytics."
    },
    {
      title: "Stored Data Types",
      value: totalStoredData,
      ...getGradientAndIcon(totalStoredData, { green: 80, orange: 250 }),
      description: "Includes cache + form data",
      tooltip: "The kinds of data websites have saved on your device, like cached files or form details. Having fewer stored items means less leftover data from sites you've visited."
    },
    {
      title: "Workers",
      value: totalWorkers,
      ...getGradientAndIcon(totalWorkers, { green: 25, orange: 100 }),
      description: "All service workers found",
      tooltip: "Small background programs that some websites install to keep tasks running even after you leave the page. Having none means no sites are running in the background on your device."
    },
    {
      title: "Avg. Trust Score",
      value: `${(averageTrustScore * 100).toFixed(0)}%`,
      ...getGradientAndIcon(averageTrustScore * 100, { green: 40, orange: 70 }, true),
      description: "Higher is safer",
      tooltip: "A safety rating that shows how trustworthy the sites you visit are. A higher score means safer and more reliable websites. 70% and above is great!"
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {items.map(({ title, value, badgeClass, Icon, description, tooltip }, i) => (
        <div key={i} className="relative">
          <Card>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {!user && title !== "Total Current Trackers" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Image
                        unoptimized
                        src="/padlock_icon.png"
                        alt="Create an account to see this data"
                        width={32}
                        height={32}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
                      <p>
                        {"Create a free account to view " + title.toLowerCase()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span>{value}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center justify-between w-full">
                {description}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button title={title}>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
                      <p>
                        {tooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
          <Badge
            variant="outline"
            className={`absolute top-4 right-4 flex gap-1 items-center justify-center rounded-lg bg-gradient-to-r ${badgeClass} shadow-md p-1`}
          >
            <Icon className="w-6 h-6 shrink-0" />
          </Badge>
        </div>
      ))}
    </div>
  );
}
