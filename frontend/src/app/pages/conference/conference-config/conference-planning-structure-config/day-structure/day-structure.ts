import { Component, computed, inject, input, model, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Day, Room, SessionType, Slot } from '../../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';
import { SlotTypeService } from '../../../../../services/slot-type.service';
import { SlotType } from '../../../../../model/slot-type.model';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-day-structure',
  imports: [
    ButtonModule,
    CommonModule,
    DatePickerModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './day-structure.html',
  styleUrl: './day-structure.scss',
  standalone: true,
})
export class DayStructure implements OnInit {

  slotTypeService = inject(SlotTypeService);
  
  rooms = input.required<Room[]>();
  day = model.required<Day>();
  sessionTypes = input.required<SessionType[]>();
  slotTypes: SlotType[] = [];

  // Shared day bounds (ISO strings). Tu peux les exposer en @Input si tu veux.
  dayStartIso = computed(() => this.day().beginTime ? this.day().beginTime : '09:00');
  dayEndIso   = computed(() => this.day().endTime ? this.day().endTime : '18:00'); 

  defaultSlotColor = '#cfe9ff';

  // computed ms & total minutes for scale
  private dayStartMs = computed(() => this.computeTimeOfDay(this.dayStartIso()));
  private dayEndMs   = computed(() => this.computeTimeOfDay(this.dayEndIso()));
  totalMinutes = computed(() => Math.max(1, (this.dayEndMs() - this.dayStartMs()) / 60000));

  // ticks (every 60 minutes by default)
  ticks = computed(() => {
    const start = new Date(this.dayStartIso());
    const end = new Date(this.dayEndIso());
    const stepMin = 60;
    const results: { label: string; topPercent: number }[] = [];
    const totalMins = (end.getTime() - start.getTime()) / 60000 || 1;
    for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + stepMin * 60000)) {
      const minsFromStart = (t.getTime() - start.getTime()) / 60000;
      const topPercent = (minsFromStart / totalMins) * 100;
      results.push({ label: this.formatHour(t), topPercent });
      if (results.length > 500) break;
    }
    return results;
  });

  // group slots by room id (computed)
  slotsByRoom = computed(() => {
    const map = new Map<string, Slot[]>();
    const slots = this.day().slots ? this.day().slots : [];
    for (const slot of slots) {
      const roomId = slot.roomId;
      if (!map.has(roomId)) map.set(roomId, []);
      map.get(roomId)!.push(slot);
    }
    return map;
  });
  beginTime: string = '09:00';
  endTime: string = '18:00';

  // Convertit un slot => top% & height% sur la base dayStart/dayEnd
  getSlotPosition(s: Slot) {
    const dayStart = this.dayStartMs();
    const totalMins = Math.max(1, this.totalMinutes());

    const sStartMs = new Date(s.startTime).getTime();
    const sEndMs = new Date(s.endTime).getTime();

    const topMins = Math.max(0, (sStartMs - dayStart) / 60000);
    // preferer duration si cohérent, sinon calculer
    const rawDuration = s.duration && s.duration > 0 ? s.duration : Math.max(1, (sEndMs - sStartMs) / 60000);
    const heightMins = Math.min(rawDuration, Math.max(0, totalMins - topMins));

    const top = (topMins / totalMins) * 100;
    const height = (heightMins / totalMins) * 100;
    return { top, height };
  }

  ngOnInit() {
    this.slotTypeService.init().subscribe(slotTypes => {
      this.slotTypes = slotTypes;
    });
  }

  computeTimeOfDay(timeStr: string) {
    return new Date(`${this.day().date}T${timeStr}:00`).getTime();
  }

  // helpers format
  private two = (n: number) => n.toString().padStart(2, '0');

  formatHour(d: Date) {
    return `${this.two(d.getHours())}:${this.two(d.getMinutes())}`;
  }
  formatTimeRange(startIso: string, endIso: string) {
    const s = new Date(startIso);
    const e = new Date(endIso);
    return `${this.formatHour(s)} - ${this.formatHour(e)}`;
  }
  getSlotsByRoom(roomId: string): Slot[] {
    return this.slotsByRoom().get(roomId) || [];
  }
  getSlotType(slotTypeId: string): SlotType | undefined {
    return this.slotTypes.find(st => st.id === slotTypeId);
  }
  // interactions
  onSlotEdit(s: Slot) { 
    console.log('Slot clicked', s); 
  }
  onSlotAdd() {
    console.log('Add slot clicked'); 
  }
  changeBeginTime(newTime: Date) {
    this.day.update(day => {
      day.beginTime = this.formatHour(newTime);
      console.log('Begin time changed:', day.beginTime);
      return day;
    });
  }
  changeEndTime(newTime: Date) {
    this.day.update(day => {
      day.endTime = this.formatHour(newTime);
      console.log('End time changed:', day.endTime);
      return day;
    });
  }
} 