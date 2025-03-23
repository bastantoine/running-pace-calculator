<script setup lang="ts">
import { ref } from 'vue'

const form_distance = ref()
const form_duration_hour = ref()
const form_duration_minutes = ref()
const form_duration_seconds = ref()
const form_pace_minutes = ref()
const form_pace_seconds = ref()

const laps = ref<{ distance: number; duration: { hours: string; minutes: string; seconds: string; } }[]>([])

function compute(event: Event) {
  const distance_meter = form_distance.value

  const duration_hour = form_duration_hour.value || 0
  const duration_minutes = form_duration_minutes.value || 0
  const duration_seconds = form_duration_seconds.value || 0

  let pace_seconds_meter = 0
  if (duration_hour === 0 && duration_minutes === 0 && duration_seconds === 0) {
    // Compute time from distance and pace
    const pace_minutes = form_pace_minutes.value || 0
    const pace_seconds = form_pace_seconds.value || 0
    let pace_seconds_km = (pace_minutes * 60) + pace_seconds
    pace_seconds_meter = pace_seconds_km / 1000
    let seconds_duration = pace_seconds_meter * distance_meter

    const hours = Math.floor(seconds_duration / 3600);
    const minutes = Math.floor((seconds_duration - hours * 3600) / 60);
    const seconds = Math.floor(seconds_duration - hours * 3600 - minutes * 60);
    form_duration_hour.value = hours
    form_duration_minutes.value = minutes
    form_duration_seconds.value = seconds
  } else {
    // Compute pace from distance and time
    let seconds_duration = (duration_hour * 3600) + (duration_minutes * 60) + duration_seconds
    let distance_km = distance_meter / 1000
    let pace_seconds_km = seconds_duration / distance_km
    pace_seconds_meter = pace_seconds_km / 1000

    const minutes = Math.floor(pace_seconds_km / 60);
    const seconds = Math.floor(pace_seconds_km - minutes * 60);
    form_pace_minutes.value = minutes
    form_pace_seconds.value = seconds
  }

  let _laps = []
  const increment = distance_meter <= 15000 ? 1000 : 5000
  let intermediate = 0
  for (intermediate = 0; intermediate < distance_meter; intermediate = intermediate + increment) {
    const total_seconds = intermediate * pace_seconds_meter
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds - hours * 3600) / 60);
    const seconds = Math.floor(total_seconds - hours * 3600 - minutes * 60);
    _laps.push({
      distance: intermediate / 1000,
      duration: {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      }
    })
  }
  if (intermediate - increment < distance_meter) {
    intermediate = distance_meter - increment
    const total_seconds = distance_meter * pace_seconds_meter
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds - hours * 3600) / 60);
    const seconds = Math.floor(total_seconds - hours * 3600 - minutes * 60);
    _laps.push({
      distance: distance_meter / 1000,
      duration: {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      }
    })
  }

  laps.value = _laps

}

function setDistance(distance: number) {
  form_distance.value = distance
}

function reset() {
  form_distance.value = undefined
  form_duration_hour.value = undefined
  form_duration_minutes.value = undefined
  form_duration_seconds.value = undefined
  form_pace_minutes.value = undefined
  form_pace_seconds.value = undefined
  laps.value = []
}

</script>

<template>
  <main>
    <section class="section">
      <div class="block">
        <h1 class="title">Running pace calculator</h1>
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
              <input v-model="form_duration_hour" class="input" type="number" placeholder="Hour">
              <label class="label">:</label>
              <input v-model="form_duration_minutes" class="input" type="number" placeholder="Minutes">
              <label class="label">:</label>
              <input v-model="form_duration_seconds" class="input" type="number" placeholder="Seconds">
            </div>
          </div>
          <div class="field">
            <label class="label">Pace (min/km)</label>
            <div class="level">
              <input v-model="form_pace_minutes" class="input" type="number" placeholder="Minutes">
              <label class="label">:</label>
              <input v-model="form_pace_seconds" class="input" type="number" placeholder="Seconds">
            </div>
          </div>
          <div class="field buttons has-addons">
            <button class="button is-success" @click="compute">Compute</button>
            <button class="button is-danger" @click="reset">Reset</button>
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
    </section>
  </main>
</template>
