import { Component, computed, inject, input, output, model, OnInit, signal, Signal, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Day, Room, SessionType, Slot } from '../../../../../model/conference.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SlotTypeService } from '../../../../../services/slot-type.service';
import { SlotType } from '../../../../../model/slot-type.model';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { SlotEditorComponent } from '../slot-editor/slot-editor';
import { DialogModule } from 'primeng/dialog';
import { ConferenceService } from '../../../../../services/conference.service';

@Component({
  selector: 'app-day-structure',
  imports: [
    ButtonModule,
    CommonModule,
    DatePickerModule,
    DialogModule,
    FormsModule,
    SlotEditorComponent,
    TranslateModule
  ],
  templateUrl: './day-structure.html',
  styleUrl: './day-structure.scss',
  standalone: true,
})
export class DayStructure implements OnInit {

  private readonly slotTypeService = inject(SlotTypeService);
  protected readonly conferenceService = inject(ConferenceService);
  private readonly translateService = inject(TranslateService);
  protected readonly defaultLanguage = signal<string>('EN');

  rooms = input.required<Room[]>();
  day = model.required<Day>();
  sessionTypes = input.required<SessionType[]>();
  slotTypes = signal<SlotType[]>([]);
  dayChanged = output<Day>();

  // Shared day bounds (ISO strings). Tu peux les exposer en @Input si tu veux.
  dayStartIso = computed(() => this.day().beginTime ? this.day().beginTime : '09:00');
  dayEndIso   = computed(() => this.day().endTime ? this.day().endTime : '18:00'); 

  defaultSlotColor = '#cfe9ff';

  // computed ms & total minutes for scale
  private dayStartMs = computed(() => this.computeTimeOfDay(this.dayStartIso()) );
  private dayEndMs   = computed(() => this.computeTimeOfDay(this.dayEndIso())   );
  totalMinutes = computed(() => Math.max(1, (this.dayEndMs() - this.dayStartMs()) / 60000));

  private readonly tickStep = 30;
  private readonly tickMainRatio = 2;

  // ticks (every 60 minutes by default)
  ticks = computed(() => {
    const start = this.dayStartMs();
    const end = this.dayEndMs();
    const results: { label: string; main: boolean }[] = [];
    let idx = 0;
    for (let t = start; t <= end; t = t + this.tickStep * 60000) {
      results.push({ 
        label: this.conferenceService.formatHour(new Date(t)), 
        main: idx % this.tickMainRatio === 0 
      });
      idx++;
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

  editedSlot = signal<Slot | undefined>(undefined);
  slotEditorVisible = signal<boolean>(false);
  private lastEditedSlotId: string|undefined;

  // Convertit un slot => top% & height% sur la base dayStart/dayEnd
  getSlotPosition(s: Slot) {
    const dayStart = this.conferenceService.timeStringToDate(this.beginTime).getTime();
    const slotStart = this.conferenceService.timeStringToDate(s.startTime).getTime();
    const delta = (slotStart - dayStart) / 60000;
    // console.log('dayStart',dayStart, 'slotStart', slotStart, 'delta', delta, "min");
    const startTick = delta / this.tickStep;
    const durationtick = s.duration / this.tickStep;
    const roomColIdx = this.rooms().findIndex(room => room.id === s.roomId);
    const position = { startTick, durationtick, roomColIdx };
    // console.log(position);
    return position;
  }

  ngOnInit() {
    this.slotTypeService.init().subscribe(slotTypes => {
      this.slotTypes.set(slotTypes);
    });
    this.translateService.onLangChange.subscribe(ev => this.defaultLanguage.set(ev.lang.toLocaleUpperCase()));
  }

  computeTimeOfDay(timeStr: string) {
    return new Date(`${this.day().date}T${timeStr}:00`).getTime();
  }

  getSlotsByRoom(roomId: string): Slot[] {
    return this.slotsByRoom().get(roomId) || [];
  }
  getSlotType(slotTypeId: string): SlotType | undefined {
    return this.slotTypes().find(st => st.id === slotTypeId);
  }
  getSessionType(sessionTypeId: string): SessionType | undefined {
    return this.sessionTypes().find(st => st.id === sessionTypeId);
  }
  // interactions
  onSlotEdit(s: Slot) { 
    this.editedSlot.set({...s});
    this.slotEditorVisible.set(true);
    this.lastEditedSlotId = s.id;
  }

  onSlotAdd() {
    console.log('onSlotAdd: lastEditedSlotId=', this.lastEditedSlotId);
    if (this.lastEditedSlotId) {
      const lastEditedSlot = this.day().slots.find(s => s.id === this.lastEditedSlotId);
      console.log('onSlotAdd: lastEditedSlot=', lastEditedSlot);
      if (lastEditedSlot) {
        this.createSlotFromPrevious(lastEditedSlot);
        return;
      } else {
        this.lastEditedSlotId = undefined;
      }
    }

    const slot: Slot = {
      id: '',
      startTime: this.beginTime, // beginning of the day
      endTime: this.conferenceService.computeSlotEndtime(this.beginTime, 30),
      duration: 30,
      roomId: this.rooms().length ? this.rooms()[0].id : '',
      slotTypeId: this.slotTypes().length ? this.slotTypes()[0].id : '',
      sessionTypeId: this.slotTypes().length && this.slotTypes()[0].isSession ? this.sessionTypes()[0].id : '',
      overflowRoomIds: []
    };
    this.editedSlot.set(slot);
    this.slotEditorVisible.set(true);
  }

  createSlotFromPrevious(prevSlot: Slot) {
    const slot: Slot = {
      id: '',
      startTime: prevSlot.endTime,
      endTime: this.conferenceService.computeSlotEndtime(prevSlot.endTime, prevSlot.duration),
      duration: prevSlot.duration,
      roomId: prevSlot.roomId,
      slotTypeId: prevSlot.slotTypeId,
      sessionTypeId: prevSlot.sessionTypeId,
      overflowRoomIds: prevSlot.overflowRoomIds
    };
    this.editedSlot.set(slot);
    this.slotEditorVisible.set(true);
  }

  changeBeginTime(newBeginTimeDate: Date) {
    this.day.update(day => {
      // check the beginTime is BEFORE the endTime
      let validBeginTime = new Date(this.computeTimeOfDay(this.conferenceService.formatHour(newBeginTimeDate)));
      if (validBeginTime.getTime() >= this.dayEndMs()) {
        validBeginTime = new Date(this.dayEndMs() - 5 * 60000); // end of day minus 5 minutes
      }
      day.beginTime = this.conferenceService.formatHour(validBeginTime);
      console.log('Begin time changed:', day.beginTime);
      return { ...day};
    });
    this.dayChanged.emit(this.day());
  }

  changeEndTime(newEndTimeDate: Date) {
    this.day.update(day => {
      // check the beginTime is BEFORE the endTime
      let validEndTime = new Date(this.computeTimeOfDay(this.conferenceService.formatHour(newEndTimeDate)));
      if (validEndTime.getTime() <= this.dayStartMs()) {
        validEndTime = new Date(this.dayStartMs() + 5 * 60000); // beginning of day plus 5 minutes
      }
      day.endTime = this.conferenceService.formatHour(validEndTime);
      console.log('End time changed:', day.endTime);
      return { ...day};
    });
    this.dayChanged.emit(this.day());
  }
  
  genId(prefix = 's'): string {
    return prefix + Math.random().toString(36).slice(2, 9);
  }
  
  onSlotSave(slot: Slot) {
    this.slotEditorVisible.set(false);
    this.editedSlot.set(undefined);
    if (slot) {
      this.day.update(day => {
        if (slot.id && slot.id.length >= 0) {
          // update an existing slot from the list
          const idx = day.slots.findIndex(s => s.id === slot.id);
          if (idx >= 0) {
            day.slots[idx] = slot;
          }
        } else {
          // add a new slot in list
          slot.id = this.genId();
          day.slots.push(slot);
        }
        this.lastEditedSlotId = slot.id;
        return { ...day};
      });
      this.dayChanged.emit(this.day());
    }
  }
  onSlotEditCancel() {
    console.log('onSlotEditCancel', this.editedSlot(), this.editedSlot()?.id);
    if (this.editedSlot() && this.editedSlot()!.id) {
      this.lastEditedSlotId = this.editedSlot()!.id;
      console.log('lastEditedSlotId', this.lastEditedSlotId);
    }
    this.slotEditorVisible.set(false);
    this.editedSlot.set(undefined);
  }
  onSlotEditRemove(slotId: string|undefined) {
    this.slotEditorVisible.set(false);
    this.editedSlot.set(undefined);
    let changed = false;
    this.day.update(day => {
      if (slotId && slotId.length >= 0) {
        // delete an existing slot from the list
        const idx = day.slots.findIndex(s => s.id === slotId);
        if (idx >= 0) {
          day.slots.splice(idx, 1);
          changed = true;
          return { ...day};
        }
      }
      return day; // no change
    });
    if (changed) this.dayChanged.emit(this.day());
  }
} 