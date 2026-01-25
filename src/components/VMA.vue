<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Duration, round } from './utils'

const vma = ref<number>()
const splits = ref<{
    value: number;
    rawDuration: number;
    duration: Duration;
}[]>([])
const allDistances = {
    short: [100, 200, 300, 400, 500, 600, 800],
    medium: [1000, 1500, 2000, 2500, 3000, 4000, 5000],
    long: [10000, 15000, 20000, 21097, 42195],
}
type distanceType = keyof typeof allDistances
const duration_based_on_vma = ref<{
    [k in distanceType]: { [k: number]: { percentage: number, duration: Duration }[] }
}>({ short: {}, medium: {}, long: {} })
const vma_percentages = [0.7, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1];

// MISC
const is_visible_mobile = "is-hidden-tablet is-hidden-desktop is-hidden-widescreen is-hidden-fullhd"
const titleize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

onMounted(() => {
    const localVMA = localStorage.getItem('vma')
    if (localVMA) {
        vma.value = Number(localVMA)
        computeVMA()
    }
})

function formatDistance(distance_meter: number): string {
    if (distance_meter == 42195) {
        return "Marathon"
    }
    if (distance_meter == 21097) {
        return "Half-marathon"
    }
    if (distance_meter >= 10000) {
        return `${round(distance_meter / 1000)} km`
    }
    return `${distance_meter} m`
}

function computeVMA() {
    const vma_kmh = vma.value || 0
    if (vma_kmh <= 0) {
        splits.value = []
        return
    }
    localStorage.setItem('vma', vma_kmh.toString())

    splits.value = vma_percentages.map(percent => {
        const duration = 60 / (percent * vma_kmh)
        return {
            value: round(percent * 100),
            rawDuration: duration, // in min/km
            duration: new Duration({ minutes: Math.floor(duration), seconds: round(Math.floor((duration - Math.floor(duration)) * 60) / 100) * 100 }),
        }
    })

    const _durations: typeof duration_based_on_vma.value = { short: {}, medium: {}, long: {} }
    for (let [category, distances] of Object.entries(allDistances)) {
        for (const distance of distances) {
            const distances: { percentage: number, duration: Duration }[] = []
            for (const split of splits.value) {
                let duration = (split.rawDuration * (distance / 1000))  // in minutes
                duration = duration * 60 // in seconds
                distances.push({
                    percentage: split.value,
                    duration: Duration.fromSeconds(duration)
                })
            }
            _durations[(category as keyof typeof allDistances)][distance] = distances
        }
    }
    duration_based_on_vma.value = _durations
}

function resetVMA() {
    vma.value = undefined
    splits.value = []
    localStorage.removeItem('vma')
}

</script>

<style scoped>
.field-addon {
    font-family: monospace;
}
</style>

<template>
    <div class="columns block">
        <div class="column">
            <div class="field has-addons">
                <p class="control is-expanded">
                    <input v-model="vma" class="input" type="number" placeholder="VMA">
                </p>
                <p class="control"><a class="button is-static field-addon">km/h</a></p>
                <p class="control"><button class="button is-success" @click="computeVMA">Compute</button></p>
                <p class="control"><button class="button is-danger" @click="resetVMA">Reset</button></p>
            </div>
        </div>
    </div>
    <div class="block" v-if="splits.length > 0">
        <div class="is-hidden-mobile">
            <div class="box">
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
                            <td v-for="split in splits">{{ split.duration.format() }}/km
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="box" v-for="(durations_per_distances, distance_category) in duration_based_on_vma">
                <table class="table is-fullwidth is-striped">
                    <thead>
                        <tr>
                            <th :colspan="vma_percentages.length + 1" style="text-align: center;">{{
                                titleize(distance_category) }} distances</th>
                        </tr>
                        <tr>
                            <th>VMA</th>
                            <th v-for="split in splits">{{ split.value }} %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="durations, distance in durations_per_distances">
                            <th>{{ formatDistance(Number(distance)) }}</th>
                            <td v-for="duration in durations">{{ duration.duration.format() }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div :class="is_visible_mobile">
            <div class="box">
                <table class="table is-fullwidth is-striped">
                    <thead>
                        <tr>
                            <th>VMA</th>
                            <th>Pace</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="split in splits">
                            <td>{{ split.value }}%</td>
                            <td>{{ split.duration.format() }}/km</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <template v-for="(durations_per_distances, distance_category) in duration_based_on_vma">
                <span class="is-size-4">{{ titleize(distance_category) }} distances</span><br />
                <template v-for="durations, distance in durations_per_distances">
                    <div class="box">
                        <table class="table is-fullwidth is-striped">
                            <thead>
                                <tr>
                                    <th colspan="2" style="text-align: center;">{{ formatDistance(Number(distance)) }}
                                    </th>
                                </tr>
                                <tr>
                                    <th>% VMA</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="duration in durations">
                                    <td>{{ duration.percentage }}%</td>
                                    <td>{{ duration.duration.format() }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </template>
        </div>
    </div>
</template>
