"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Thermometer } from "lucide-react"

interface SensorReading {
  timestamp: string
  dryTemp: number
  wetTemp: number
  depression: number
}

interface TemperatureChartProps {
  data: SensorReading[]
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  const formatTime = (timestamp: string) => {
    // If timestamp is already formatted (contains comma), extract time portion
    if (timestamp.includes(",")) {
      const timePart = timestamp.split(", ")[1]
      if (timePart) {
        return timePart // Return full time like "1:20:17 PM"
      }
    }

    // Fallback to original parsing for ISO timestamps
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit", // Added seconds for exact time
      })
    } catch (error) {
      return timestamp // Return original if parsing fails
    }
  }

  const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = sortedData.map((reading) => ({
    time: formatTime(reading.timestamp),
    dryTemp: Number.isFinite(reading.dryTemp) ? Number(reading.dryTemp) : 0,
    wetTemp: Number.isFinite(reading.wetTemp) ? Number(reading.wetTemp) : 0,
    depression: Number.isFinite(reading.depression) ? Number(reading.depression) : 0,
  }))

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <CardTitle className="text-base sm:text-lg">Tea Processing Temperature Control</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Critical temperature monitoring for optimal tea fermentation and drying
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <ChartContainer
          config={{
            dryTemp: {
              label: "Dry Temperature",
              color: "#dc2626", // Red for dry temp
            },
            wetTemp: {
              label: "Wet Temperature",
              color: "#2563eb", // Blue for wet temp
            },
            depression: {
              label: "Depression",
              color: "#16a34a", // Green for depression
            },
          }}
          className="h-[200px] xs:h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#374151"
                fontSize={8}
                tickLine={true} // Enable tick lines for better axis visibility
                axisLine={true} // Ensure axis line is visible
                angle={-45}
                textAnchor="end"
                height={60} // Increased height to accommodate longer time labels
                interval="preserveStartEnd"
                className="text-[8px] xs:text-[9px] sm:text-[10px]"
              />
              <YAxis
                stroke="#374151"
                fontSize={8}
                tickLine={true} // Enable tick lines for better axis visibility
                axisLine={true} // Ensure axis line is visible
                label={{
                  value: "Temp (°F)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: "8px" },
                }}
                domain={[60, 90]}
                type="number"
                tickCount={5}
                tickFormatter={(value) => `${Math.round(value)}°`}
                allowDataOverflow={false}
                width={35}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded-lg shadow-lg text-xs sm:text-sm">
                        <p className="font-medium">{`Time: ${label}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${Number(entry.value).toFixed(1)}°F`}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "8px", paddingTop: "5px" }}
                iconSize={6}
                className="hidden sm:block text-[8px] sm:text-[10px]"
              />
              <Line
                type="monotone"
                dataKey="dryTemp"
                stroke="var(--color-dryTemp)"
                name="Dry Temp"
                strokeWidth={2}
                dot={{ fill: "var(--color-dryTemp)", strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: "var(--color-dryTemp)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="wetTemp"
                stroke="var(--color-wetTemp)"
                name="Wet Temp"
                strokeWidth={2}
                dot={{ fill: "var(--color-wetTemp)", strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: "var(--color-wetTemp)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="depression"
                stroke="var(--color-depression)"
                name="Depression"
                strokeWidth={2}
                dot={{ fill: "var(--color-depression)", strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: "var(--color-depression)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-full flex-shrink-0"></div>
            <span className="text-red-800">Optimal dry temp: 75-85°F for tea withering</span>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
            <span className="text-blue-800">Wet temp indicates moisture content</span>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded-full flex-shrink-0"></div>
            <span className="text-green-800">Depression shows drying potential</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
