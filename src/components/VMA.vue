<script setup lang="ts">
import { ref } from 'vue'

type Duration = { hours: number | null; minutes: number | null; seconds: number | null }
type ShortDuration = { minutes: number | null; seconds: number | null }
type FormattedDuration = { hours: string; minutes: string; seconds: string }

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
</template>
