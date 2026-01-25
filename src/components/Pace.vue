<script setup lang="ts">
import { ref } from 'vue'
import { Duration } from './utils';

const form_distance = ref<number>()
const form_duration = ref<Duration>(new Duration())
const form_pace = ref<Duration>(new Duration())
const laps = ref<{
    distance: number;
    duration: Duration;
}[]>([])
const precomputed_distances = [
    { value: 10000, label: '10km' },
    { value: 15000, label: '15km' },
    { value: 20000, label: '20km' },
    { value: 21097, label: 'Half-marathon' },
    { value: 42195, label: 'Marathon' },
]

// MISC
const is_visible_mobile = "is-hidden-tablet is-hidden-desktop is-hidden-widescreen is-hidden-fullhd"

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
        const seconds_duration = pace_seconds_meter * distance_meter

        form_duration.value = Duration.fromSeconds(seconds_duration)
    } else {
        // Compute pace from distance and time
        const seconds_duration = (duration_hour * 3600) + (duration_minutes * 60) + duration_seconds
        const distance_km = distance_meter / 1000
        const pace_seconds_km = seconds_duration / distance_km
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
            duration: (Duration.fromSeconds(total_seconds)),
        })
    }
    if (intermediate - increment < distance_meter) {
        intermediate = distance_meter - increment
        const total_seconds = distance_meter * pace_seconds_meter
        _laps.push({
            distance: distance_meter / 1000,
            duration: (Duration.fromSeconds(total_seconds)),
        })
    }

    laps.value = _laps

}

function setDistance(distance: number) {
    form_distance.value = distance
}

function resetPace() {
    form_distance.value = undefined
    form_duration.value = new Duration()
    form_pace.value = new Duration()
    laps.value = []
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
            <div class="block">
                <label class="label">Distance (in m)</label>
                <div class="field has-addons is-hidden-mobile">
                    <p class="control is-expanded">
                        <input v-model="form_distance" class="input" type="number" placeholder="Distance">
                    </p>
                    <p class="control"><a class="button is-static field-addon">m</a></p>
                    <p class="control" v-for="distance in precomputed_distances">
                        <button class="button" @click="setDistance(distance.value)">{{ distance.label
                        }}</button>
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
                        <button v-for="distance in precomputed_distances" class="button"
                            @click="setDistance(distance.value)">{{
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
                        <p class="control"><a class="button is-static field-addon"
                                style="border-top-right-radius: 0px;">s</a>
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
                    <td class="pl-2">{{ lap.duration.format() }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>
