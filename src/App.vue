<script setup lang="ts">
import { ref } from 'vue'

type Duration = { hours: number; minutes: number; seconds: number }
type ShortDuration = { minutes: number; seconds: number }
type FormattedDuration = { hours: string; minutes: string; seconds: string }
type Pace = { minutes: number; seconds: number }

const form_distance = ref<number>()
const form_duration = ref<Duration>({ hours: 0, minutes: 0, seconds: 0 })
const form_pace = ref<Pace>({ minutes: 0, seconds: 0 })
const laps = ref<{
  distance: number;
  duration: FormattedDuration;
}[]>([])
const vma = ref<number>()
const splits = ref<{
  value: number;
  duration: ShortDuration;
}[]>([])

function splitSeconds(total_seconds: number, format?: boolean): Duration | FormattedDuration {
  const hours = Math.floor(total_seconds / 3600);
  const minutes = Math.floor((total_seconds - hours * 3600) / 60);
  const seconds = Math.floor(total_seconds - hours * 3600 - minutes * 60);
  return ({
    hours: format ? String(hours).padStart(2, '0') : hours,
    minutes: format ? String(minutes).padStart(2, '0') : minutes,
    seconds: format ? String(seconds).padStart(2, '0') : seconds,
  } as Duration | FormattedDuration)
}

// Helper to round to 2 decimals
const round = (num: number) => (Math.round(num * 100) / 100)

function computePace() {
  const distance_meter = form_distance.value || 0

  const duration_hour = form_duration.value.hours || 0
  const duration_minutes = form_duration.value.minutes || 0
  const duration_seconds = form_duration.value.seconds || 0

  let pace_seconds_meter = 0
  if (duration_hour === 0 && duration_minutes === 0 && duration_seconds === 0) {
    // Compute time from distance and pace
    const pace_minutes = form_pace.value.minutes || 0
    const pace_seconds = form_pace.value.seconds || 0
    let pace_seconds_km = (pace_minutes * 60) + pace_seconds
    pace_seconds_meter = pace_seconds_km / 1000
    let seconds_duration = pace_seconds_meter * distance_meter

    const duration = splitSeconds(seconds_duration)
    form_duration.value = (duration as Duration)
  } else {
    // Compute pace from distance and time
    let seconds_duration = (duration_hour * 3600) + (duration_minutes * 60) + duration_seconds
    let distance_km = distance_meter / 1000
    let pace_seconds_km = seconds_duration / distance_km
    pace_seconds_meter = pace_seconds_km / 1000

    const minutes = Math.floor(pace_seconds_km / 60);
    const seconds = Math.floor(pace_seconds_km - minutes * 60);
    form_pace.value.minutes = minutes
    form_pace.value.seconds = seconds
  }

  let _laps = []
  const increment = distance_meter <= 15000 ? 1000 : 5000
  let intermediate = 0
  for (intermediate = 0; intermediate < distance_meter; intermediate = intermediate + increment) {
    const total_seconds = intermediate * pace_seconds_meter
    _laps.push({
      distance: intermediate / 1000,
      duration: (splitSeconds(total_seconds, true) as FormattedDuration),
    })
  }
  if (intermediate - increment < distance_meter) {
    intermediate = distance_meter - increment
    const total_seconds = distance_meter * pace_seconds_meter
    _laps.push({
      distance: distance_meter / 1000,
      duration: (splitSeconds(total_seconds, true) as FormattedDuration),
    })
  }

  laps.value = _laps

}

function setDistance(distance: number) {
  form_distance.value = distance
}

function resetPace() {
  form_distance.value = undefined
  form_duration.value = { hours: 0, minutes: 0, seconds: 0 }
  form_pace.value = { minutes: 0, seconds: 0 }
  splits.value = []
}

function computeVMA() {
  const vma_kmh = vma.value || 0
  if (vma_kmh <= 0) {
    splits.value = []
    return
  }
  splits.value = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1].map(percent => {
    const duration = 60 / (percent * vma_kmh)
    return {
      value: round(percent * 100),
      duration: { minutes: Math.floor(duration), seconds: round(Math.floor((duration - Math.floor(duration)) * 60) / 100) * 100 },
    }
  })
}

function resetVMA() {
  vma.value = undefined
  splits.value = []
}

</script>

<template>
  <main>
    <section class="section">
      <div class="block">
        <h1 class="title">Running tools</h1>
      </div>
      <div class="block">
        <h3 class="subtitle">Pace calculator</h3>
      </div>
      <div class="columns block">
        <div class="column is-9">
          <div class="field">
            <label class="label">Distance (in m)</label>
            <input v-model="form_distance" class="input" type="number" placeholder="Distance">
          </div>
          <div class="field buttons has-addons">
            <button class="button" @click="setDistance(10000)">10km</button>
            <button class="button" @click="setDistance(15000)">15km</button>
            <button class="button" @click="setDistance(20000)">20km</button>
            <button class="button" @click="setDistance(21097)">Half-marathon</button>
            <button class="button" @click="setDistance(42195)">Marathon</button>
          </div>
          <div class="field">
            <label class="label">Time</label>
            <div class="level">
              <input v-model="form_duration.hours" class="input" type="number" placeholder="Hour">
              <label class="label">:</label>
              <input v-model="form_duration.minutes" class="input" type="number" placeholder="Minutes">
              <label class="label">:</label>
              <input v-model="form_duration.seconds" class="input" type="number" placeholder="Seconds">
            </div>
          </div>
          <div class="field">
            <label class="label">Pace (min/km)</label>
            <div class="level">
              <input v-model="form_pace.minutes" class="input" type="number" placeholder="Minutes">
              <label class="label">:</label>
              <input v-model="form_pace.seconds" class="input" type="number" placeholder="Seconds">
            </div>
          </div>
          <div class="field buttons has-addons">
            <button class="button is-success" @click="computePace">Compute</button>
            <button class="button is-danger" @click="resetPace">Reset</button>
          </div>
        </div>
        <div class="column is-offset-1 is-2">
          <table>
            <tr v-for="lap in laps">
              <td style="text-align: right;" class="pr-2">{{ lap.distance }} km</td>
              <td class="pl-2">{{ lap.duration.hours }}:{{ lap.duration.minutes }}:{{ lap.duration.seconds }}</td>
            </tr>
          </table>
        </div>
      </div>
      <hr />
      <div class="block">
        <h3 class="subtitle">VMA</h3>
      </div>
      <div class="columns block">
        <div class="column is-9">
          <div class="field">
            <label class="label">VMA (in km/h)</label>
            <input v-model="vma" class="input" type="number" placeholder="VMA">
          </div>
          <div class="field buttons has-addons">
            <button class="button is-success" @click="computeVMA">Compute</button>
            <button class="button is-danger" @click="resetVMA">Reset</button>
          </div>
        </div>
        <div class="column is-offset-1 is-2">
          <table>
            <tr v-for="split in splits">
              <td style="text-align: right;" class="pr-2">{{ split.value }}%</td>
              <td class="pl-2">{{ split.duration.minutes }}m{{ split.duration.seconds ? split.duration.seconds + 's' :
                '' }}/km
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section>
  </main>
</template>
