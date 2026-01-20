<script setup lang="ts">
import { ref } from 'vue'

type Duration = { hours: number | null; minutes: number | null; seconds: number | null }
type ShortDuration = { minutes: number | null; seconds: number | null }
type FormattedDuration = { hours: string; minutes: string; seconds: string }
type Pace = { minutes: number | null; seconds: number | null }

// PACE
const form_distance = ref<number>()
const form_duration = ref<Duration>({ hours: null, minutes: null, seconds: null })
const form_pace = ref<Pace>({ minutes: null, seconds: null })
const laps = ref<{
  distance: number;
  duration: FormattedDuration;
}[]>([])
const precomputed_distances = [
  { value: 10000, label: '10km' },
  { value: 15000, label: '15km' },
  { value: 20000, label: '20km' },
  { value: 21097, label: 'Half-marathon' },
  { value: 42195, label: 'Marathon' },
]

// VMA
const vma = ref<number>()
const splits = ref<{
  value: number;
  rawDuration: number;
  duration: ShortDuration;
}[]>([])
const allDistances = {
  short: [100, 200, 300, 400, 500, 600, 800],
  medium: [1000, 1500, 2000, 2500, 3000, 4000, 5000],
  long: [10000, 15000, 20000, 21097, 42195],
}
type distanceType = keyof typeof allDistances
const duration_based_on_vma = ref<{
  [k in distanceType]: { [k: number]: (Duration)[] }
}>({ short: {}, medium: {}, long: {} })
const vma_percentages = [0.7, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1];

// MISC
const is_visible_mobile = "is-hidden-tablet is-hidden-desktop is-hidden-widescreen is-hidden-fullhd"

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

function formatDuration(duration: Duration): string {
  const hours = String(duration.hours || 0).padStart(2, '0')
  const minutes = String(duration.minutes || 0).padStart(2, '0')
  const seconds = String(duration.seconds || 0).padStart(2, '0')
  if (hours === '00') {
    return `${minutes}m ${seconds}s`
  }
  return `${hours}h ${minutes}m ${seconds}s`
}

function formatDistance(distance_meter: number): string {
  if (distance_meter >= 10000) {
    return `${round(distance_meter / 1000)} km`
  }
  return `${distance_meter} m`
}

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
  form_duration.value = { hours: null, minutes: null, seconds: null }
  form_pace.value = { minutes: null, seconds: null }
  laps.value = []
}

function computeVMA() {
  const vma_kmh = vma.value || 0
  if (vma_kmh <= 0) {
    splits.value = []
    return
  }

  splits.value = vma_percentages.map(percent => {
    const duration = 60 / (percent * vma_kmh)
    return {
      value: round(percent * 100),
      rawDuration: duration, // in min/km
      duration: { minutes: Math.floor(duration), seconds: round(Math.floor((duration - Math.floor(duration)) * 60) / 100) * 100 },
    }
  })

  for (let [category, distances] of Object.entries(allDistances)) {
    for (const distance of distances) {
      duration_based_on_vma.value[(category as keyof typeof allDistances)][distance] = []
      for (const split of splits.value) {
        let duration = (split.rawDuration * (distance / 1000))  // in minutes
        duration = duration * 60 // in seconds
        duration_based_on_vma.value[(category as keyof typeof allDistances)][distance].push((splitSeconds(duration) as Duration))
      }
    }
  }
  console.log(duration_based_on_vma.value)
}

function resetVMA() {
  vma.value = undefined
  splits.value = []
}

</script>

<style scoped>
.field-addon {
  font-family: monospace;
}
</style>

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
          <div class="block">
            <label class="label">Distance (in m)</label>
            <div class="field has-addons is-hidden-mobile">
              <p class="control is-expanded">
                <input v-model="form_distance" class="input" type="number" placeholder="Distance">
              </p>
              <p class="control"><a class="button is-static field-addon">m</a></p>
              <p class="control" v-for="distance in precomputed_distances">
                <button class="button" @click="setDistance(distance.value)">{{ distance.label }}</button>
              </p>
            </div>
            <div :class=is_visible_mobile>
              <div class="field has-addons">
                <p class="control is-expanded">
                  <input v-model="form_distance" class="input" type="number" placeholder="Distance">
                </p>
                <p class="control"><a class="button is-static field-addon">m</a></p>
              </div>
              <div class="buttons">
                <button v-for="distance in precomputed_distances" class="button" @click="setDistance(distance.value)">{{
                  distance.label }}</button>
              </div>
            </div>
          </div>
          <div class="block">
            <label class="label">Time</label>
            <div class="field has-addons is-hidden-mobile">
              <p class="control is-expanded">
                <input v-model="form_duration.hours" class="input" type="number" placeholder="Hour">
              </p>
              <p class="control"><a class="button is-static field-addon">h</a></p>
              <p class="control is-expanded">
                <input v-model="form_duration.minutes" class="input" type="number" placeholder="Minutes">
              </p>
              <p class="control"><a class="button is-static field-addon">m</a></p>
              <p class="control is-expanded">
                <input v-model="form_duration.seconds" class="input" type="number" placeholder="Seconds">
              </p>
              <p class="control"><a class="button is-static field-addon">s</a></p>
            </div>

            <div :class="is_visible_mobile">
              <div class="field has-addons mb-0">
                <p class="control is-expanded">
                  <input v-model="form_duration.hours" class="input" type="number" placeholder="Hour"
                    style="border-bottom-left-radius: 0px;">
                </p>
                <p class="control">
                  <a class="button is-static field-addon" style="border-bottom-right-radius: 0px;">h</a>
                </p>
              </div>
              <div class="field has-addons mb-0">
                <p class="control is-expanded">
                  <input v-model="form_duration.minutes" class="input" type="number" placeholder="Minutes"
                    style="border-bottom-left-radius: 0px; border-top-left-radius: 0px;border-top: none;border-bottom: none;">
                </p>
                <p class="control">
                  <a class="button is-static field-addon"
                    style="border-bottom-right-radius: 0px; border-top-right-radius: 0px;border-top: none;border-bottom: none;height:100%">m</a>
                </p>
              </div>
              <div class="field has-addons">
                <p class="control is-expanded">
                  <input v-model="form_duration.seconds" class="input" type="number" placeholder="Seconds"
                    style="border-top-left-radius: 0px;">
                </p>
                <p class="control">
                  <a class="button is-static field-addon" style="border-top-right-radius: 0px;">s</a>
                </p>
              </div>
            </div>
          </div>
          <div class="block">
            <label class="label">Pace (min/km)</label>
            <div class="field has-addons is-hidden-mobile">
              <p class="control is-expanded">
                <input v-model="form_pace.minutes" class="input" type="number" placeholder="Minutes">
              </p>
              <p class="control"><a class="button is-static field-addon">m</a></p>
              <p class="control is-expanded">
                <input v-model="form_pace.seconds" class="input" type="number" placeholder="Seconds">
              </p>
              <p class="control"><a class="button is-static field-addon">s</a></p>
            </div>
            <div :class="is_visible_mobile">
              <div class="field has-addons mb-0">
                <p class="control is-expanded">
                  <input v-model="form_pace.minutes" class="input" type="number" placeholder="Minutes"
                    style="border-bottom-left-radius: 0px;border-bottom: none;">
                </p>
                <p class="control"><a class="button is-static field-addon"
                    style="border-bottom-right-radius: 0px;border-bottom: none;">m</a></p>
              </div>
              <div class="field has-addons">
                <p class="control is-expanded">
                  <input v-model="form_pace.seconds" class="input" type="number" placeholder="Seconds"
                    style="border-top-left-radius: 0px;">
                </p>
                <p class="control"><a class="button is-static field-addon" style="border-top-right-radius: 0px;">s</a>
                </p>
              </div>
            </div>
          </div>
          <div class="block buttons has-addons">
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
          <div class="field has-addons">
            <p class="control is-expanded">
              <input v-model="vma" class="input" type="number" placeholder="VMA">
            </p>
            <p class="control"><a class="button is-static field-addon">km/h</a></p>
          </div>
          <div class="field buttons has-addons">
            <button class="button is-success" @click="computeVMA">Compute</button>
            <button class="button is-danger" @click="resetVMA">Reset</button>
          </div>
        </div>
      </div>
      <div class="block" v-if="splits.length > 0">
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>VMA</th>
              <th v-for="split in splits">{{ split.value }} %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Pace</th>
              <td v-for="split in splits">{{ split.duration.minutes }}m{{ split.duration.seconds ?
                split.duration.seconds
                + 's' :
                '' }}/km
              </td>
            </tr>
            <tr>
              <td :colspan="vma_percentages.length + 1" style="text-align: center;">Short distances</td>
            </tr>
            <tr v-for="durations, distance in duration_based_on_vma.short">
              <th>{{ formatDistance(Number(distance)) }}</th>
              <td v-for="duration in durations">{{ formatDuration(duration) }}</td>
            </tr>
            <tr>
              <td :colspan="vma_percentages.length + 1" style="text-align: center;">Medium distances</td>
            </tr>
            <tr v-for="durations, distance in duration_based_on_vma.medium">
              <th>{{ formatDistance(Number(distance)) }}</th>
              <td v-for="duration in durations">{{ formatDuration(duration) }}</td>
            </tr>
            <tr>
              <td :colspan="vma_percentages.length + 1" style="text-align: center;">Long distances</td>
            </tr>
            <tr v-for="durations, distance in duration_based_on_vma.long">
              <th>{{ formatDistance(Number(distance)) }}</th>
              <td v-for="duration in durations">{{ formatDuration(duration) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
