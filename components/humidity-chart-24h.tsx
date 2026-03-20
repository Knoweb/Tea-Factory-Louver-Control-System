"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Droplets } from "lucide-react"

interface SensorReading {
  timestamp: string
  rh: number
  depression: number
}

interface HumidityChart24hProps {
  data: SensorReading[]
}

export function HumidityChart24h({ data }: HumidityChart24hProps) {
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
        second: "2-digit",
      })
    } catch (error) {
      return timestamp // Return original if parsing fails
    }
  }

  // Filter data for last 24 hours
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const last24hData = data.filter((reading) => {
    const readingTime = new Date(reading.timestamp)
    return readingTime >= twentyFourHoursAgo
  })

  console.log("[v0] Humidity Chart 24h - Total data:", data.length, "Last 24h data:", last24hData.length)

  const sortedData = [...last24hData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = sortedData.map((reading) => ({
    time: formatTime(reading.timestamp),
    humidity: reading.rh,
    depression: reading.depression,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.dataKey === "humidity" ? "%" : "°F"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <CardTitle className="text-base sm:text-lg">Last 24 Hours Humidity Trends</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          {chartData.length} humidity readings from the past 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[200px] xs:h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">No data available for the last 24 hours</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={{
                humidity: {
                  label: "Relative Humidity",
                  color: "#0891b2", // Cyan for humidity
                },
                depression: {
                  label: "Temperature Depression",
                  color: "#7c3aed", // Purple for depression
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
                    tickLine={true}
                    axisLine={true}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={Math.max(0, Math.floor(chartData.length / 6))}
                    className="text-[8px] xs:text-[9px] sm:text-[10px]"
                  />
                  <YAxis
                    stroke="#374151"
                    fontSize={8}
                    tickLine={true}
                    axisLine={true}
                    width={35}
                    label={{
                      value: "RH% / Dep°F",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: "8px" },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "65%", fontSize: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="var(--color-humidity)"
                    name="Relative Humidity (%)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-humidity)", strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: "var(--color-humidity)", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="depression"
                    stroke="var(--color-depression)"
                    name="Temperature Depression (°F)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-depression)", strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: "var(--color-depression)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-600 rounded-full flex-shrink-0"></div>
                <span className="text-cyan-800">Ideal RH: 60-70%</span>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
                <span className="text-purple-800">Drying efficiency</span>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200 sm:col-span-2 lg:col-span-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-600 rounded-full flex-shrink-0"></div>
                <span className="text-amber-800">Quality zone</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
