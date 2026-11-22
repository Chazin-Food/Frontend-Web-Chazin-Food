import { Users, Star, ShoppingBag } from "lucide-react";

export function ClientesStatsCards({ clientes = [], stats = null }) {
  const totalCount = stats ? stats.total : clientes.length;
  const vipCount = stats ? stats.vip : clientes.filter((c) => (c.tipo || (c.esVip ? "VIP" : "")) === "VIP").length;
  const frecuentesCount = stats ? stats.frecuentes : clientes.filter((c) => (c.tipo || "") === "Frecuente").length;
  const nuevosCount = stats ? stats.nuevos : clientes.filter((c) => (c.tipo || "") === "Nuevo").length;

  const statCards = [
    {
      id: "total",
      title: "Total Clientes",
      value: totalCount,
      subtext: "registrados",
      subtextColor: "text-gray-400 dark:text-gray-500",
      icon: Users,
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-500 dark:text-blue-400"
    },
    {
      id: "vip",
      title: "Clientes VIP",
      value: vipCount,
      subtext: "con descuento",
      subtextColor: "text-amber-600 dark:text-amber-400",
      icon: Star,
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-500 dark:text-amber-400"
    },
    {
      id: "frecuentes",
      title: "Frecuentes",
      value: frecuentesCount,
      subtext: "activos",
      subtextColor: "text-emerald-600 dark:text-emerald-400",
      icon: ShoppingBag,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-500 dark:text-emerald-400"
    },
    {
      id: "nuevos",
      title: "Nuevos",
      value: nuevosCount,
      subtext: "este mes",
      subtextColor: "text-rose-500 dark:text-rose-400",
      icon: ShoppingBag,
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
      iconColor: "text-rose-500 dark:text-rose-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4 transition-all hover:shadow-sm min-w-0"
          >
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center shrink-0`}>
              <IconComponent className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">
                {card.title}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {card.value}
                </span>
                <span className={`text-[10.5px] sm:text-xs font-medium ${card.subtextColor} truncate`}>
                  {card.subtext}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
