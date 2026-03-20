"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Thermometer, Droplets, Wind, Activity, Database, Wifi, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { TemperatureChart } from "@/components/temperature-chart"
import { HumidityChart } from "@/components/humidity-chart"
import { LouverStatusChart } from "@/components/louver-status-chart"
import { TemperatureChart24h } from "@/components/temperature-chart-24h"
import { HumidityChart24h } from "@/components/humidity-chart-24h"
import { LouverStatusChart24h } from "@/components/louver-status-chart-24h"

// Mock data structure matching ESP32 Firebase data
interface SensorReading {
  timestamp: string
  dryTemp: number
  rh: number
  wetTemp: number
  depression: number
  louverStatus: string
}

const firebaseConfig = {
  databaseURL: "https://tea-withering-system-4d483-default-rtdb.firebaseio.com",
}

const isFirebaseConfigured = () => {
  return !!firebaseConfig.databaseURL
}

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error)
}

const isAbortError = (error: unknown) => {
  return error instanceof Error && error.name === "AbortError"
}

const generateMockData = (): SensorReading[] => {
  const now = new Date()
  const data: SensorReading[] = []

  for (let i = 7; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000) // 5-minute intervals
    data.push({
      timestamp: timestamp.toLocaleString(), // Local time format
      dryTemp: 76 + Math.random() * 8,
      rh: 58 + Math.random() * 12,
      wetTemp: 70 + Math.random() * 6,
      depression: 5 + Math.random() * 4,
      louverStatus: Math.random() > 0.4 ? "Open" : "Closed",
    })
  }
  return data
}

const createZeroReading = (): SensorReading => {
  return {
    timestamp: new Date().toLocaleString(),
    dryTemp: 0,
    rh: 0,
    wetTemp: 0,
    depression: 0,
    louverStatus: "0% Open",
  }
}

const fetchFirebaseData = async (troughId: string): Promise<SensorReading | null> => {
  try {
    if (!isFirebaseConfigured()) {
      console.log("[v0] Firebase not properly configured - missing database URL")
      return null
    }

    console.log("[v0] Fetching data from Firebase:", firebaseConfig.databaseURL)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${firebaseConfig.databaseURL}/troughs/${troughId}/readings.json?orderBy="$key"&limitToLast=1`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Raw Firebase data:", data)

    if (data) {
      const latestKey = Object.keys(data)[0]
      const latestReading = data[latestKey]

      if (latestReading) {
        // Convert Firebase timestamp to local time
        const timestamp = new Date(latestReading.timestamp || Date.now()).toLocaleString()

        let humidityValue = 0
        if (latestReading.humidity !== undefined && latestReading.humidity !== null) {
          humidityValue = Number.parseFloat(latestReading.humidity)
        } else if (latestReading.RH !== undefined && latestReading.RH !== null) {
          humidityValue = Number.parseFloat(latestReading.RH)
        } else if (latestReading.rh !== undefined && latestReading.rh !== null) {
          humidityValue = Number.parseFloat(latestReading.rh)
        }

        let louverStatus = "Unknown"
        if (latestReading.louverPercent !== undefined && latestReading.louverPercent !== null) {
          const percentage = Number.parseFloat(latestReading.louverPercent)
          louverStatus = `${percentage}% Open`
        } else if (latestReading.louverStatus) {
          louverStatus = latestReading.louverStatus
        }

        const depressionValue = (() => {
          const tryParse = (value: any) => {
            if (value === undefined || value === null) return null
            const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
            return Number.isNaN(parsed) ? null : parsed
          }

          const diffFValue = tryParse(latestReading.diffF)
          if (diffFValue !== null) return diffFValue

          const diffCValue = tryParse(latestReading.diffC)
          if (diffCValue !== null) return diffCValue

          const wbdCValue = tryParse(latestReading.WBD_C)
          if (wbdCValue !== null) return wbdCValue

          const wbdFValue = tryParse(latestReading.WBD_F)
          if (wbdFValue !== null) return wbdFValue

          const depressionFieldValue = tryParse(latestReading.depression)
          if (depressionFieldValue !== null) return depressionFieldValue

          return 0
        })()

        const reading = {
          timestamp,
          dryTemp:
            Number.parseFloat(latestReading.dryTempC) ||
            Number.parseFloat(latestReading.dryTempF) ||
            Number.parseFloat(latestReading.dryTemp) ||
            0,
          rh: humidityValue || 0,
          wetTemp:
            Number.parseFloat(latestReading.wetTempC) ||
            Number.parseFloat(latestReading.wetTempF) ||
            Number.parseFloat(latestReading.wetTemp) ||
            0,
          depression: depressionValue,
          louverStatus: louverStatus,
        }

        console.log("[v0] Parsed Firebase reading:", reading)
        return reading
      }
    }
    return null
  } catch (error) {
    if (isAbortError(error)) {
      console.error("[v0] Firebase fetch timeout - request took too long")
    } else if (getErrorMessage(error).includes("Failed to fetch")) {
      console.warn(`[v0] Firebase network error or trough not active yet (${troughId})`)
    } else {
      console.error("[v0] Firebase fetch error:", getErrorMessage(error))
    }
    return null // Return null instead of throwing to prevent app crashes
  }
}

const fetchAllFirebaseData = async (troughId: string): Promise<SensorReading[]> => {
  try {
    if (!isFirebaseConfigured()) {
      console.log("[v0] Firebase not configured for complete data fetch")
      return []
    }

    console.log("[v0] Fetching ALL historical data from Firebase...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased to 30 seconds for mobile

    let response: Response | null = null
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        // Fetch without orderBy to get all data
        response = await fetch(`${firebaseConfig.databaseURL}/troughs/${troughId}/readings.json`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          break // Success, exit retry loop
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        retryCount++
        console.log(`[v0] Firebase fetch attempt ${retryCount} failed:`, getErrorMessage(error))

        if (retryCount < maxRetries) {
          console.log(`[v0] Retrying Firebase fetch in ${retryCount * 2} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, retryCount * 2000)) // Progressive delay
        } else {
          throw error // Re-throw after all retries exhausted
        }
      }
    }

    clearTimeout(timeoutId)

    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status ?? "unknown"}`)
    }

    const data = await response.json()
    console.log("[v0] Firebase response size:", data ? Object.keys(data).length : 0, "top-level keys")
    console.log("[v0] Sample Firebase data:", data ? Object.keys(data).slice(0, 2).map(k => ({ key: k, value: data[k] })) : [])

    if (data) {
      const allReadings: SensorReading[] = []

      function isReadingObject(obj: any): boolean {
        // Check if this object has temperature/humidity/louver data (direct reading)
        if (!obj || typeof obj !== "object") return false
        return (
          obj.dryTempC !== undefined ||
          obj.dryTempF !== undefined ||
          obj.RH !== undefined ||
          obj.rh !== undefined ||
          obj.humidity !== undefined ||
          obj.louverPercent !== undefined
        )
      }

      function extractReadings(obj: any, parentKey: string = ""): void {
        if (!obj || typeof obj !== "object") return

        Object.keys(obj).forEach((key) => {
          const value = obj[key]

          // If this value is a direct reading, process it
          if (isReadingObject(value)) {
            processReading(value, parentKey || key)
          }
          // If it's an object but not a reading, recurse deeper
          else if (value && typeof value === "object" && !Array.isArray(value)) {
            extractReadings(value, parentKey || key)
          }
        })
      }

      function processReading(reading: any, fallbackTimestamp: string): void {
        // Get timestamp - prefer explicit timestamp field, then use the key
        let timestamp = reading.timestamp || fallbackTimestamp
        if (!timestamp || timestamp === "null") {
          console.warn("[v0] Warning: Reading missing timestamp:", reading)
          return // Skip readings without valid timestamps
        }

        try {
          // Ensure it's a proper date
          const dateObj = new Date(timestamp)
          if (isNaN(dateObj.getTime())) {
            console.warn("[v0] Invalid timestamp format:", timestamp)
            return
          }
          timestamp = dateObj.toLocaleString()
        } catch (e) {
          console.warn("[v0] Error parsing timestamp:", timestamp, e)
          return
        }

        let humidityValue = 0
        if (reading.humidity !== undefined && reading.humidity !== null) {
          humidityValue = Number.parseFloat(reading.humidity)
        } else if (reading.RH !== undefined && reading.RH !== null) {
          humidityValue = Number.parseFloat(reading.RH)
        } else if (reading.rh !== undefined && reading.rh !== null) {
          humidityValue = Number.parseFloat(reading.rh)
        }

        let louverStatus = "Unknown"
        if (reading.louverPercent !== undefined && reading.louverPercent !== null) {
          const percentage = Number.parseFloat(reading.louverPercent)
          louverStatus = `${percentage}% Open`
        } else if (reading.louverStatus) {
          louverStatus = reading.louverStatus
        }

        const depressionValue = (() => {
          // Try to parse each possible field, handling both strings and numbers
          const tryParse = (value: any) => {
            if (value === undefined || value === null) return null // Skip undefined/null
            const parsed = typeof value === "string" ? parseFloat(value) : Number(value)
            return isNaN(parsed) ? null : parsed
          }

          const diffFValue = tryParse(reading.diffF)
          console.log("[v0] Depression - diffF:", reading.diffF, "parsed:", diffFValue)
          if (diffFValue !== null) return diffFValue

          const wbdCValue = tryParse(reading.WBD_C)
          if (wbdCValue !== null) return wbdCValue

          const wbdFValue = tryParse(reading.WBD_F)
          if (wbdFValue !== null) return wbdFValue

          const deprValue = tryParse(reading.depression)
          if (deprValue !== null) return deprValue

          return 0
        })()

        allReadings.push({
          timestamp,
          dryTemp:
            Number.parseFloat(reading.dryTempF) ||
            Number.parseFloat(reading.dryTempC) ||
            Number.parseFloat(reading.dryTemp) ||
            0,
          rh: humidityValue || 0,
          wetTemp:
            Number.parseFloat(reading.wetTempF) ||
            Number.parseFloat(reading.wetTempC) ||
            Number.parseFloat(reading.wetTemp) ||
            0,
          depression: depressionValue,
          louverStatus: louverStatus,
        })
      }

      // Recursively extract all readings from any nested structure
      extractReadings(data)

      // Sort by timestamp (oldest first)
      allReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      console.log("[v0] Extracted complete Firebase data:", allReadings.length, "readings")
      if (allReadings.length > 0) {
        const lastReading = allReadings[allReadings.length - 1]
        console.log("[v0] Latest reading:", { timestamp: lastReading.timestamp, depression: lastReading.depression, dryTemp: lastReading.dryTemp })
      }
      return allReadings
    }

    return []
  } catch (error) {
    if (isAbortError(error)) {
      console.error("[v0] Complete Firebase fetch timeout after 30 seconds")
    } else {
      console.error("[v0] Error fetching complete Firebase data:", getErrorMessage(error))
    }
    return []
  }
}

export default function TeaFactoryDashboard({ params }: { params: { id: string } }) {
  const { signOut } = useAuth()
  const troughId = params.id
  const [sensorData, setSensorData] = useState<SensorReading[]>(() => generateMockData())
  const [historicalData, setHistoricalData] = useState<SensorReading[]>(() => generateMockData())
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [dataSource, setDataSource] = useState<"mock" | "firebase">("firebase")
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  const [lastValidFirebaseTime, setLastValidFirebaseTime] = useState<Date | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<string>("")

  const updateSensorData = useCallback(async () => {
    console.log("[v0] Generating new sensor reading...")
    setIsUpdating(true)
    const now = new Date()
    let newReading: SensorReading

    if (dataSource === "firebase") {
      const firebaseReading = await fetchFirebaseData(troughId)
      if (firebaseReading) {
        // Check if data is stale (older than 5 minutes)
        const firebaseTimestamp = new Date(firebaseReading.timestamp)
        const dataAge = Date.now() - firebaseTimestamp.getTime()
        const isStale = dataAge > 5 * 60 * 1000 // 5 minutes

        if (isStale) {
          console.log("[v0] Firebase data is too stale, keeping last known reading when available")
          newReading = currentReading ?? createZeroReading()
          setFirebaseConnected(false)
          console.log("[v0] Using last known values due to stale Firebase:", newReading)
        } else {
          // Check if this is the same data as the last reading
          const isDuplicate =
            currentReading &&
            currentReading.timestamp === firebaseReading.timestamp &&
            currentReading.dryTemp === firebaseReading.dryTemp &&
            currentReading.rh === firebaseReading.rh

          if (isDuplicate) {
            console.log("[v0] WARNING: Received duplicate data from Firebase - ESP32 may not be sending new data")
            setIsUpdating(false)
            return // Don't add duplicate data
          }

          newReading = firebaseReading
          setFirebaseConnected(true)
          setLastValidFirebaseTime(firebaseTimestamp)
          console.log("[v0] Firebase reading:", newReading)
        }
      } else {
        setFirebaseConnected(false)
        newReading = currentReading ?? createZeroReading()
        console.log("[v0] Firebase failed, keeping last known values:", newReading)
      }
    } else {
      newReading = {
        timestamp: now.toLocaleString(),
        dryTemp: 76 + Math.random() * 8,
        rh: 58 + Math.random() * 12,
        wetTemp: 70 + Math.random() * 6,
        depression: 5 + Math.random() * 4,
        louverStatus: Math.random() > 0.4 ? "Open" : "Closed",
      }
      console.log("[v0] Mock reading:", newReading)
    }

    setSensorData((prev) => {
      const newData = [...prev.slice(-19), newReading]
      // Sort data chronologically
      newData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      console.log("[v0] Updated sensor data array length:", newData.length)
      return newData
    })
    setHistoricalData((prev) => {
      const newHistorical = [...prev, newReading]
      // Sort historical data chronologically
      newHistorical.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      console.log("[v0] Updated historical data length:", newHistorical.length)
      return newHistorical
    })
    setCurrentReading(newReading)
    setLastUpdate(now)
    setUpdateCount((prev) => {
      const newCount = prev + 1
      console.log("[v0] Update count:", newCount)
      return newCount
    })

    setTimeout(() => setIsUpdating(false), 500)
  }, [dataSource, currentReading])

  useEffect(() => {
    const initializeData = async () => {
      if (sensorData.length > 0) {
        setCurrentReading(sensorData[sensorData.length - 1])
      }

      try {
        console.log("[v0] Firebase is configured, testing connection...")
        const testData = await fetchFirebaseData(troughId)
        const connected = testData !== null
        setFirebaseConnected(connected)

        if (testData && dataSource === "firebase") {
          console.log("[v0] Using Firebase data:", testData)
          setCurrentReading(testData)
          setSensorData((prev) => [...prev.slice(-19), testData])
          setHistoricalData((prev) => [...prev, testData])
        } else {
          console.log("[v0] Firebase connection failed, using mock data")
          setFirebaseConnected(false)
        }
      } catch (error) {
        console.error("[v0] Initialization error:", getErrorMessage(error))
        setFirebaseConnected(false)
      }
    }

    initializeData()

    console.log(`[v0] Starting sensor updates - Source: ${dataSource}, Interval: 30s`)

    const updateInterval = 30000 // 30 seconds to match ESP32 timing

    const interval = setInterval(updateSensorData, updateInterval)

    return () => {
      console.log("[v0] Cleaning up sensor update interval")
      clearInterval(interval)
    }
  }, []) // Removed all dependencies to prevent re-mounting issues

  useEffect(() => {
    const handleDataSourceChange = async () => {
      if (dataSource === "firebase") {
        const testData = await fetchFirebaseData()
        setFirebaseConnected(testData !== null)
        if (testData) {
          setCurrentReading(testData)
          setSensorData((prev) => [...prev.slice(-19), testData])
          setHistoricalData((prev) => [...prev, testData])
        }
      }
    }

    handleDataSourceChange()
  }, [dataSource])

  const toggleDataSource = async () => {
    const newSource = dataSource === "mock" ? "firebase" : "mock"
    setDataSource(newSource)

    if (newSource === "firebase") {
      const testData = await fetchFirebaseData()
      setFirebaseConnected(testData !== null)
    }
  }

  const downloadCSV = async () => {
    console.log("[v0] Starting complete CSV export...")
    setDownloadStatus("Preparing download...")

    let completeData: SensorReading[] = []
    let dataSourceInfo = ""

    console.log("[v0] Fetching ALL historical Firebase data (including past data)...")
    setDownloadStatus("Fetching complete historical database...")

    const allFirebaseData = await fetchAllFirebaseData(troughId)
    console.log("[v0] Firebase fetch returned:", allFirebaseData.length, "readings")
    console.log(
      "[v0] First 3 Firebase readings:",
      allFirebaseData.slice(0, 3).map((r) => ({ timestamp: r.timestamp, dryTemp: r.dryTemp })),
    )

    if (allFirebaseData.length > 0) {
      completeData = allFirebaseData
      dataSourceInfo = `Firebase Database (${completeData.length} total readings)`
      console.log("[v0] SUCCESS: Using complete Firebase historical data for CSV:", completeData.length, "readings")
    } else {
      // Only fallback to session data if Firebase fetch completely fails after retries
      completeData = historicalData
      dataSourceInfo = `Session Data (${completeData.length} readings - Firebase unavailable)`
      console.log(
        "[v0] FALLBACK: Firebase fetch failed after retries, using session data:",
        completeData.length,
        "readings",
      )
    }

    setDownloadStatus("Processing all historical data...")

    const filteredData = completeData // Include ALL historical data - no date filtering

    console.log(
      `[v0] Including ALL historical data: ${filteredData.length} readings from complete Firebase dataset (all past data included)`,
    )
    console.log("[v0] Data date range:", filteredData.length > 0 ? `${filteredData[0].timestamp} to ${filteredData[filteredData.length - 1].timestamp}` : "No data")

    const headers = [
      "# Tea Factory Louver Control System - Complete Historical Data (All Past Data Included)",
      `# Export Date: ${new Date().toLocaleString()}`,
      `# Total Historical Readings: ${filteredData.length} (includes all past data from Firebase)`,
      "",
      "Timestamp (Local Time),Dry Temperature (°F),Relative Humidity (%),Wet Temperature (°F),Depression (°F),Louver Status",
    ]

    const csvContent = [
      ...headers,
      ...filteredData.map((row) =>
        [
          `"${row.timestamp}"`, // Quoted timestamp to handle commas in date format
          row.dryTemp.toFixed(1),
          row.rh.toFixed(1),
          row.wetTemp.toFixed(1),
          row.depression.toFixed(1),
          row.louverStatus,
        ].join(","),
      ),
    ].join("\n")

    setDownloadStatus("Creating file with all historical data...")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    const filename = `tea-factory-complete-history-${dateStr}-${timeStr}.csv`
    a.download = filename

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    console.log(
      `[v0] CSV export completed: ${filteredData.length} readings from ${dataSourceInfo} (ALL PAST DATA INCLUDED)`,
    )

    setDownloadStatus(`✅ Downloaded: ${filename} (${filteredData.length} total readings - ALL PAST DATA INCLUDED)`)

    setTimeout(() => {
      setDownloadStatus("")
    }, 5000)

    if (filteredData.length > 0) {
      console.log("[v0] CSV export successful - included ALL historical Firebase data (past and present)")
    } else {
      console.log("[v0] Warning: No data available for CSV export")
    }
  }

  const downloadLast24HoursCSV = async () => {
    console.log("[v0] Starting last 24 hours CSV export...")
    setDownloadStatus("Preparing last 24 hours download...")

    let completeData: SensorReading[] = []
    let dataSourceInfo = ""

    console.log("[v0] Fetching Firebase data for last 24 hours...")
    setDownloadStatus("Fetching last 24 hours data...")

    const allFirebaseData = await fetchAllFirebaseData(troughId)
    if (allFirebaseData.length > 0) {
      completeData = allFirebaseData
      dataSourceInfo = `Firebase Database (${completeData.length} total readings available)`
      console.log("[v0] SUCCESS: Using Firebase data, filtering for last 24 hours:", completeData.length, "readings")
    } else {
      // Only fallback to session data if Firebase fetch completely fails after retries
      completeData = historicalData
      dataSourceInfo = `Session Data (${completeData.length} readings - Firebase unavailable)`
      console.log(
        "[v0] FALLBACK: Firebase fetch failed after retries, using session data:",
        completeData.length,
        "readings",
      )
    }

    setDownloadStatus("Filtering last 24 hours data...")

    // Filter data from last 24 hours
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const filteredData = completeData.filter((reading) => {
      const readingTime = new Date(reading.timestamp)
      return readingTime >= twentyFourHoursAgo
    })

    console.log(
      `[v0] Filtered last 24 hours: ${filteredData.length} readings from ${completeData.length} total readings`,
    )

    const headers = [
      "# Tea Factory Louver Control System - Last 24 Hours Data",
      `# Export Date: ${new Date().toLocaleString()}`,
      `# Time Range: Last 24 hours (${twentyFourHoursAgo.toLocaleString()} to ${now.toLocaleString()})`,
      `# Data Points: ${filteredData.length} readings`,
      "",
      "Timestamp (Local Time),Dry Temperature (°F),Relative Humidity (%),Wet Temperature (°F),Depression (°F),Louver Status",
    ]

    const csvContent = [
      ...headers,
      ...filteredData.map((row) =>
        [
          `"${row.timestamp}"`, // Quoted timestamp to handle commas in date format
          row.dryTemp.toFixed(1),
          row.rh.toFixed(1),
          row.wetTemp.toFixed(1),
          row.depression.toFixed(1),
          row.louverStatus,
        ].join(","),
      ),
    ].join("\n")

    setDownloadStatus("Creating file with last 24 hours data...")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    const filename = `tea-factory-last-24h-${dateStr}-${timeStr}.csv`
    a.download = filename

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    console.log(
      `[v0] CSV export completed: ${filteredData.length} readings from last 24 hours from ${dataSourceInfo}`,
    )

    setDownloadStatus(`✅ Downloaded: ${filename} (${filteredData.length} readings from last 24 hours)`)

    setTimeout(() => {
      setDownloadStatus("")
    }, 5000)

    if (filteredData.length > 0) {
      console.log("[v0] CSV export successful - included last 24 hours Firebase data")
    } else {
      console.log("[v0] Warning: No data available for last 24 hours CSV export")
    }
  }

  const getProcessingStatus = () => {
    if (!currentReading) return { status: "Unknown", color: "gray" }

    const { dryTemp, rh, louverStatus } = currentReading

    if (dryTemp >= 75 && dryTemp <= 85 && rh >= 60 && rh <= 70) {
      return { status: "Optimal", color: "green" }
    } else if (dryTemp >= 70 && dryTemp <= 90 && rh >= 55 && rh <= 75) {
      return { status: "Acceptable", color: "yellow" }
    } else {
      return { status: "Monitoring", color: "blue" }
    }
  }

  const calculateOptimalLouverPercentage = (depression: number) => {
    if (depression < 4) {
      // Air too humid, turn on louver fully
      return 100
    } else if (depression > 8) {
      // Air too dry, turn off louver
      return 0
    } else {
      // At depression = 4°F: louver = 100%
      // At depression = 8°F: louver = 0%
      // Linear formula: louver = 100 - ((depression - 4) / (8 - 4)) * 100
      const percentage = 100 - ((depression - 4) / 4) * 100

      // Ensure percentage stays within bounds and round to 1 decimal place
      return Math.max(0, Math.min(100, Math.round(percentage * 10) / 10))
    }
  }

  const getCurrentLouverPercentage = () => {
    if (!currentReading?.louverStatus) return 0

    // Extract percentage from status strings like "80% Open", "50% Open", etc.
    const match = currentReading.louverStatus.match(/(\d+)%/)
    if (match) {
      return Number.parseInt(match[1])
    }

    // Fallback for simple status strings
    if (currentReading.louverStatus.toLowerCase().includes("open")) return 100
    if (currentReading.louverStatus.toLowerCase().includes("closed")) return 0
    if (currentReading.louverStatus.toLowerCase().includes("half")) return 50

    return 0
  }

  const getDepressionStatus = (depression: number) => {
    if (depression < 4) {
      return { status: "Too Humid - Louver FULL ON", color: "blue", recommendation: "Turn on louver fully (100%)" }
    } else if (depression > 8) {
      return { status: "Too Dry - Louver OFF", color: "red", recommendation: "Turn off louver (0%)" }
    } else {
      const optimalPercentage = calculateOptimalLouverPercentage(depression)
      return {
        status: "Optimal Range",
        color: "green",
        recommendation: `Maintain louver at ${optimalPercentage}%`,
      }
    }
  }

  const getLouverOpeningPercentage = () => {
    if (historicalData.length === 0) return 0
    const openCount = historicalData.filter((reading) => reading.louverStatus === "Open").length
    return Math.round((openCount / historicalData.length) * 100)
  }

  const handleManualRefresh = async () => {
    console.log("[v0] Manual refresh triggered")
    await updateSensorData() // Use the same update function
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-2 sm:p-4 lg:p-6 xl:p-8 relative overflow-hidden">
      {/* Static leaf emojis positioned around the interface */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-10 text-2xl">🍃</div>
        <div className="absolute top-20 right-20 text-xl">🌿</div>
        <div className="absolute top-40 left-1/4 text-lg">🌱</div>
        <div className="absolute top-60 right-1/3 text-2xl">🍃</div>
        <div className="absolute bottom-40 left-20 text-xl">🌿</div>
        <div className="absolute bottom-60 right-10 text-lg">🌱</div>
        <div className="absolute top-32 left-1/2 text-xl">🍃</div>
        <div className="absolute top-16 right-1/4 text-lg">🌿</div>
        <div className="absolute top-80 left-1/3 text-2xl">🌱</div>
        <div className="absolute bottom-32 right-1/2 text-xl">🍃</div>
        <div className="absolute bottom-80 left-1/2 text-lg">🌿</div>
        <div className="absolute top-1/2 right-16 text-2xl">🌱</div>
        <div className="absolute top-1/3 left-16 text-xl">🍃</div>
        <div className="absolute bottom-1/3 right-1/4 text-lg">🌿</div>
        <div className="absolute top-1/4 right-1/2 text-2xl">🌱</div>
        <div className="absolute bottom-1/4 left-1/3 text-xl">🍃</div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6 lg:mb-8">
          {/* Top section with logo and title */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4 sm:p-6 border-b">
            <Link href="/" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Link>
            <div className="flex justify-center w-full sm:w-auto">
              <Image
                src="/sanota-logo.jpg"
                alt="SANOTA Logo"
                width={120}
                height={40}
                className="h-8 sm:h-10 lg:h-12 w-auto flex-shrink-0"
              />
            </div>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-700">
                <span className="text-balance leading-tight">{troughId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Louver Control</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold font-sans text-teal-600 mt-2">
                {"Every Leaf Deserves Care"}
              </p>
            </div>
            
            <div className="absolute top-4 right-4 sm:static sm:top-auto sm:right-auto">
              <Button variant="outline" size="sm" onClick={signOut} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Status badges and controls section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6">
            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge
                variant="outline"
                className={`text-sm px-3 py-2 ${getProcessingStatus().color === "green"
                  ? "border-green-500 text-green-700 bg-green-50"
                  : getProcessingStatus().color === "yellow"
                    ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                    : "border-blue-500 text-blue-700 bg-blue-50"
                  }`}
              >
                {getProcessingStatus().status}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-2 border-emerald-500 text-emerald-700 bg-emerald-50">
                {`Depression: ${currentReading?.depression?.toFixed(1) || "0.0"}°F`}
              </Badge>

              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-4 py-2">
                <span className="text-sm text-green-700 font-medium">Louver:</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          getCurrentLouverPercentage() === 0
                            ? "#dc2626"
                            : getCurrentLouverPercentage() === 100
                              ? "#16a34a"
                              : "#f59e0b"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${getCurrentLouverPercentage()}, 100`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-700">{`${getCurrentLouverPercentage()}%`}</span>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Current Opening</span>
                </div>
              </div>

              {currentReading?.depression !== undefined && (
                <Badge
                  variant="outline"
                  className={`text-sm px-3 py-2 ${getDepressionStatus(currentReading.depression).color === "red"
                    ? "border-red-500 text-red-700 bg-red-50"
                    : getDepressionStatus(currentReading.depression).color === "blue"
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-green-500 text-green-700 bg-green-50"
                    }`}
                >
                  {getDepressionStatus(currentReading.depression).status}
                </Badge>
              )}

              {isUpdating && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-2 border-blue-500 text-blue-700 bg-blue-50 animate-pulse"
                >
                  Updating...
                </Badge>
              )}
            </div>

            {/* Connection status and controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-2 border-gray-500 text-gray-700 bg-gray-50">
                  Updates: {updateCount}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-sm px-3 py-2 ${dataSource === "firebase" ? "border-orange-500 text-orange-700 bg-orange-50" : "border-purple-500 text-purple-700 bg-purple-50"}`}
                >
                  {dataSource === "firebase" ? "Firebase (30s)" : "Mock (30s)"}
                </Badge>
                {dataSource === "firebase" && (
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-2 ${firebaseConnected ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50"}`}
                  >
                    {firebaseConnected ? "Connected" : "Disconnected"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm font-medium">
                    {lastUpdate.toLocaleTimeString()}.{lastUpdate.getMilliseconds().toString().padStart(3, "0")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleDataSource} className="h-9 w-9 p-0 bg-transparent">
                    {dataSource === "firebase" ? <Database className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isUpdating}
                    className="h-9 w-9 p-0 bg-transparent"
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-sm font-medium text-red-800 text-balance leading-tight">
                Dry Temperature
              </CardTitle>
              <Thermometer className="h-5 w-5 text-red-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-red-700">{`${currentReading?.dryTemp.toFixed(1)}°F`}</div>
              <p className="text-xs text-red-600 text-pretty mt-1 leading-tight">Withering chamber ambient</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-sm font-medium text-blue-800 text-balance leading-tight">
                Wet Temperature
              </CardTitle>
              <Droplets className="h-5 w-5 text-blue-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-blue-700">{`${currentReading?.wetTemp.toFixed(1)}°F`}</div>
              <p className="text-xs text-blue-600 text-pretty mt-1 leading-tight">Moisture content indicator</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-sm font-medium text-cyan-800 text-balance leading-tight">
                Relative Humidity
              </CardTitle>
              <Wind className="h-5 w-5 text-cyan-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-cyan-700">{`${currentReading?.rh.toFixed(1)}%`}</div>
              <p className="text-xs text-cyan-600 text-pretty mt-1 leading-tight">Critical for tea quality</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-sm font-medium text-emerald-800 text-balance leading-tight">
                Depression
              </CardTitle>
              <Activity className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-700">
                {`${currentReading?.depression?.toFixed(1) || "0.0"}°F`}
              </div>
              <p className="text-xs text-emerald-600 text-pretty mt-1 leading-relaxed">
                {currentReading?.depression == null
                  ? "Waiting for data..."
                  : currentReading.depression < 4
                    ? "Too humid - Open louver fully"
                    : currentReading.depression > 8
                      ? "Too dry - Close louver"
                      : "Optimal drying range"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-lime-50 border-green-200 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-sm font-medium text-green-800 text-balance leading-tight">
                Louver Control
              </CardTitle>
              <Wind className="h-5 w-5 text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentReading?.louverStatus?.includes("Open") ? "default" : "secondary"}
                    className={`text-sm ${currentReading?.louverStatus?.includes("Open") ? "bg-green-600" : "bg-gray-500"}`}
                  >
                    {`${currentReading?.louverStatus || "Unknown"}`}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-green-700">{`${getCurrentLouverPercentage()}% Open`}</div>
              </div>
              <p className="text-xs text-green-600 text-pretty mt-1 leading-relaxed">
                Current airflow control position
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="xl:col-span-2">
            <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
              <TemperatureChart data={sensorData} />
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
            <HumidityChart data={sensorData} />
          </div>
          <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
            <LouverStatusChart data={sensorData} />
          </div>
        </div>

        {/* Last 24 Hours Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Last 24 Hours Overview</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-2">
              <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
                <TemperatureChart24h data={sensorData} />
              </div>
            </div>
            <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
              <HumidityChart24h data={sensorData} />
            </div>
            <div className="w-full overflow-hidden rounded-lg shadow-sm bg-white">
              <LouverStatusChart24h data={sensorData} />
            </div>
          </div>
        </div>

        {/* Data Export */}
        <Card className="bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-balance leading-tight">Tea Processing Data Export</span>
            </CardTitle>
            <CardDescription className="text-sm text-pretty mt-1 leading-relaxed">
              Exports readings from Firebase database. Choose between last 24 hours or all historical data.
              {dataSource === "firebase" && firebaseConnected
                ? " Includes complete ESP32 sensor history from Firebase."
                : ` Currently showing ${historicalData.length} session readings.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={downloadLast24HoursCSV}
                  disabled={!!downloadStatus && !downloadStatus.includes("✅")}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:flex-1 px-6 py-3"
                >
                  <Download className="h-4 w-4 flex-shrink-0" />
                  <span className="text-balance leading-tight">
                    {downloadStatus && !downloadStatus.includes("✅") && downloadStatus.includes("24")
                      ? downloadStatus
                      : "Download Last 24 Hours (CSV)"}
                  </span>
                </Button>

                <Button
                  onClick={downloadCSV}
                  disabled={!!downloadStatus && !downloadStatus.includes("✅")}
                  className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:flex-1 px-6 py-3"
                >
                  <Download className="h-4 w-4 flex-shrink-0" />
                  <span className="text-balance leading-tight">
                    {downloadStatus && !downloadStatus.includes("✅") && !downloadStatus.includes("24")
                      ? downloadStatus
                      : "Download All Historical Data (CSV)"}
                  </span>
                </Button>
              </div>

              {downloadStatus && (
                <div
                  className={`p-3 rounded-md text-sm ${downloadStatus.includes("✅")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                    }`}
                >
                  {downloadStatus.includes("✅") ? (
                    <div>
                      <p className="font-medium">{downloadStatus}</p>
                      <p className="text-xs mt-1 opacity-75">
                        📱 On mobile: Check your Downloads folder or browser's download notification
                      </p>
                    </div>
                  ) : (
                    <p>{downloadStatus}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                <strong>Last 24 Hours:</strong> Downloads sensor data from the past 24 hours for quick analysis.
                <br />
                <strong>All Historical Data:</strong> Downloads all available readings from Firebase database (all past
                data).
                {dataSource === "firebase" && firebaseConnected
                  ? " Data availability depends on how long your ESP32 has been running and sending data to Firebase."
                  : ` Currently ${historicalData.length} readings from this session.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
