"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Wind } from "lucide-react"

interface SensorReading {
  timestamp: string
  louverStatus: string
}

interface LouverStatusChart24hProps {
  data: SensorReading[]
}

export function LouverStatusChart24h({ data }: LouverStatusChart24hProps) {
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

  console.log("[v0] Louver Chart 24h - Total data:", data.length, "Last 24h data:", last24hData.length)

  const sortedData = [...last24hData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Parse louver percentage from status string
  const chartData = sortedData.map((reading) => {
    let louverPercent = 0
    if (reading.louverStatus.includes("%")) {
      louverPercent = parseFloat(reading.louverStatus.match(/(\d+(?:\.\d+)?)/)?.[1] || "0")
    }
    return {
      time: formatTime(reading.timestamp),
      louverPercent,
      status: reading.louverStatus,
    }
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
          <CardTitle className="text-base sm:text-lg">Last 24 Hours Louver Control</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          {chartData.length} louver status readings from the past 24 hours
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
                louverPercent: {
                  label: "Louver Opening (%)",
                  color: "#0d9488", // Teal for louver
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
                    label={{
                      value: "Louver %",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: "8px" },
                    }}
                    domain={[0, 100]}
                    type="number"
                    tickCount={6}
                    tickFormatter={(value) => `${value}%`}
                    width={40}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dataPoint = chartData[chartData.findIndex((d) => d.time === label)]
                        return (
                          <div className="bg-white p-2 border rounded-lg shadow-lg text-xs sm:text-sm">
                            <p className="font-medium">{`Time: ${label}`}</p>
                            <p style={{ color: payload[0].color }}>
                              {`Louver: ${Number(payload[0].value).toFixed(1)}% Open`}
                            </p>
                            {dataPoint && <p className="text-gray-600">{dataPoint.status}</p>}
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
                    type="stepAfter"
                    dataKey="louverPercent"
                    stroke="var(--color-louverPercent)"
                    name="Louver Opening"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-louverPercent)", strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, stroke: "var(--color-louverPercent)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-teal-50 rounded-lg border border-teal-200">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-teal-600 rounded-full flex-shrink-0"></div>
                <span className="text-teal-800">Controls airflow and ventilation</span>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-600 rounded-full flex-shrink-0"></div>
                <span className="text-emerald-800">0% = Closed, 100% = Fully Open</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
