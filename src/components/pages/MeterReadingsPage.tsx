import React, { useState } from 'react';
import { Header } from '../layout/Header.tsx';
import { Room, PropertySettings } from '../../api/types.ts';
import { Zap, Droplets, Check } from 'lucide-react';

interface MeterReadingsPageProps {
  rooms: Room[];
  settings: PropertySettings;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onUpdateReading: (roomId: string, currentElec: number, currentWater: number) => void;
}

export const MeterReadingsPage: React.FC<MeterReadingsPageProps> = ({
  rooms,
  settings,
  selectedMonth,
  onMonthChange,
  onUpdateReading,
}) => {
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied');

  // Track local edits per room
  const [localReadings, setLocalReadings] = useState<{
    [roomId: string]: { currentElec: number; currentWater: number };
  }>(() => {
    const map: { [roomId: string]: { currentElec: number; currentWater: number } } = {};
    occupiedRooms.forEach((r) => {
      map[r.id] = {
        currentElec: r.meterReading.currentElectricity,
        currentWater: r.meterReading.currentWater,
      };
    });
    return map;
  });

  const [savedStatus, setSavedStatus] = useState<{ [roomId: string]: boolean }>({});

  const handleElecChange = (roomId: string, val: number) => {
    setLocalReadings((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        currentElec: val,
      },
    }));
    onUpdateReading(
      roomId,
      val,
      localReadings[roomId]?.currentWater || 0
    );
    triggerSavedIndicator(roomId);
  };

  const handleWaterChange = (roomId: string, val: number) => {
    setLocalReadings((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        currentWater: val,
      },
    }));
    onUpdateReading(
      roomId,
      localReadings[roomId]?.currentElec || 0,
      val
    );
    triggerSavedIndicator(roomId);
  };

  const triggerSavedIndicator = (roomId: string) => {
    setSavedStatus((prev) => ({ ...prev, [roomId]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [roomId]: false }));
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Meter Readings"
        subtitle="Enter this month's electricity and water readings"
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />

      <div className="meter-readings-list space-y-4">
        {occupiedRooms.map((room) => {
          const reading = localReadings[room.id] || {
            currentElec: room.meterReading.currentElectricity,
            currentWater: room.meterReading.currentWater,
          };

          const elecUsage = Math.max(0, reading.currentElec - room.meterReading.previousElectricity);
          const elecCost = Math.round(elecUsage * settings.electricityRate);

          const waterUsage = Math.max(0, reading.currentWater - room.meterReading.previousWater);
          const waterCost = Math.round(waterUsage * settings.waterRate);

          const totalCharge = room.monthlyRent + elecCost + waterCost;

          return (
            <div
              key={room.id}
              className="rl-card meter-card bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all"
            >
              {/* Card Header */}
              <div className="meter-card-header flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="meter-room-no font-bold text-lg text-[#0F172A]">
                    {room.roomNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    Floor {room.floor}
                  </span>
                  <span className="text-slate-800 font-semibold ml-1">
                    {room.tenant?.name}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Total charge
                  </div>
                  <div className="text-xl font-extrabold text-[#0F172A] tabular-nums">
                    ₱{totalCharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    incl. ₱{room.monthlyRent.toLocaleString()} rent
                  </div>
                </div>
              </div>

              {/* Utility Grid */}
              <div className="meter-utilities-grid grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* Electricity Block */}
                <div className="utility-block bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="utility-header electricity flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>ELECTRICITY</span>
                    </div>
                    {savedStatus[room.id] && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Auto-saved
                      </span>
                    )}
                  </div>

                  <div className="reading-input-row flex items-center gap-3">
                    <div className="reading-prev-box bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Previous
                      </span>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {room.meterReading.previousElectricity.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-slate-300 font-bold">→</span>

                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Current reading
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={reading.currentElec}
                        onChange={(e) => handleElecChange(room.id, Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 shadow-2xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="utility-usage-calc mt-3 text-xs text-slate-600 font-medium flex items-center justify-between">
                    <span>Usage: <strong className="font-bold text-slate-900 tabular-nums">{Number(elecUsage.toFixed(1))} kWh</strong></span>
                    <span className="font-bold text-blue-700 tabular-nums">
                      ₱{elecCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Water Block */}
                <div className="utility-block bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="utility-header water flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <Droplets className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                      <span>WATER</span>
                    </div>
                    {savedStatus[room.id] && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Auto-saved
                      </span>
                    )}
                  </div>

                  <div className="reading-input-row flex items-center gap-3">
                    <div className="reading-prev-box bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Previous
                      </span>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {room.meterReading.previousWater.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-slate-300 font-bold">→</span>

                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Current reading
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={reading.currentWater}
                        onChange={(e) => handleWaterChange(room.id, Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 shadow-2xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="utility-usage-calc mt-3 text-xs text-slate-600 font-medium flex items-center justify-between">
                    <span>Usage: <strong className="font-bold text-slate-900 tabular-nums">{Number(waterUsage.toFixed(2))} m³</strong></span>
                    <span className="font-bold text-blue-700 tabular-nums">
                      ₱{waterCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
