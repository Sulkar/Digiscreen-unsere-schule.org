<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="false" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="[]" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode !== 'edition'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode !== 'edition' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-rebours">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<div class="rebours edition">
						<div class="heures" v-if="affichageHeures === 'oui'">
							<label>{{ $t('heures') }}</label>
							<input type="number" :value="heures" :min="0" :max="23" @input="heures = $event.target.value">
						</div>
						<div class="minutes">
							<label>{{ $t('minutes') }}</label>
							<input type="number" :value="minutes" :min="0" @input="minutes = $event.target.value">
						</div>
						<div class="secondes">
							<label>{{ $t('secondes') }}</label>
							<input type="number" :value="secondes" :min="0" :max="59" @input="secondes = $event.target.value">
						</div>
					</div>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
						<div class="conteneur-affichage-heures">
							<label>{{ $t('afficherHeures') }}</label>
							<div class="affichage-heures" >
								<span class="oui">
									<input type="radio" :id="'heures_oui_' + id" :name="'heures_oui_' + id" value="oui" :checked="affichageHeures === 'oui'" @change="modifierAffichageHeures($event.target.value)">
									<label :for="'heures_oui_' + id">{{ $t('oui') }}</label>
								</span>
								<span class="non">
									<input type="radio" :id="'heures_non_' + id" :name="'heures_oui_' + id" value="non" :checked="affichageHeures === 'non'" @change="modifierAffichageHeures($event.target.value)">
									<label :for="'heures_non_' + id">{{ $t('non') }}</label>
								</span>
							</div>
						</div>
					</div>
				</div>
				<div class="contenu inactif" v-else>
					<div class="rebours">
						<svg :height="$convertirRem(42)" :width="$convertirRem(42)" :class="{'actif': this.mode === 'decompte'}" :style="{'animation': 'rebours ' + dureeMs + 'ms linear forwards', 'stroke-dasharray': Math.PI * 2 * $convertirRem(20.2), 'stroke-dashoffset': Math.PI * 2 * $convertirRem(20.2)}">
							<circle :cx="$convertirRem(21)" :cy="$convertirRem(21)" :r="$convertirRem(20.2)" stroke="#00ced1" :stroke-width="$convertirRem(1.6)" fill="#f9f9f9" />
						</svg>
						<div class="decompte">
							<span class="heures" v-if="affichageHeures === 'oui'">{{ texteHeures }}</span>
							<span class="separateur" v-if="affichageHeures === 'oui'">:</span>
							<span class="minutes">{{ texteMinutes }}</span>
							<span class="separateur">:</span>
							<span class="secondes">{{ texteSecondes }}</span>
						</div>
					</div>
					<div class="actions">
						<span class="bouton danger" v-if="tempsEcoule">{{ $t('tempsEcoule') }}</span>
						<span class="bouton" role="button" tabindex="0" @click="demarrer(0)" v-else-if="mode === 'lecture'">{{ $t('demarrer') }}</span>
						<span class="bouton" role="button" tabindex="0" @click="pause" v-else-if="mode === 'decompte'"><i class="material-icons">pause</i></span>
						<span class="bouton" role="button" tabindex="0" @click="continuer" v-else-if="mode === 'pause'"><i class="material-icons">play_arrow</i></span>
					</div>
				</div>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PRebours',
	components: {
		VueDragResize
	},
	props: {
		panneau: Object,
		largeurPage: Number,
		hauteurPage: Number,
		finRedimensionnement: Boolean,
		zIndex: Number,
		export: Boolean
	},
	extends: Panneau,
	data () {
		return {
			chargement: true,
			mode: 'edition',
			deplacement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 42,
			minh: 22.2,
			statut: '',
			dimensions: {},
			heures: 0,
			minutes: 0,
			secondes: 0,
			texteHeures: '',
			texteMinutes: '',
			texteSecondes: '',
			duree: '',
			dureeMs: 0,
			decompte: '',
			tempsRestant: '',
			tempsEcoule: false,
			affichageHeures: 'non'
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { heures: this.heures, minutes: this.minutes, secondes: this.secondes, affichageHeures: this.affichageHeures }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
			}
		},
		finRedimensionnement: function () {
			this.positionner()
		},
		hauteurPage: function () {
			this.positionner()
		}
	},
	created () {
		this.titre = this.$t('compteRebours')
		this.id = this.panneau.id
		this.w = this.panneau.w
		this.h = this.panneau.h
		this.x = this.panneau.x
		this.y = this.panneau.y
		this.z = this.panneau.z
		this.statut = this.panneau.statut
		this.dimensions = this.panneau.dimensions
		if (this.panneau.titre) {
			this.titre = this.panneau.titre
		}
		if (this.panneau.mode !== '') {
			this.mode = this.panneau.mode
		}
		if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		if (this.panneau.contenu !== '') {
			if (this.panneau.contenu.hasOwnProperty('heures')) {
				this.heures = this.panneau.contenu.heures
			}
			this.minutes = this.panneau.contenu.minutes
			this.secondes = this.panneau.contenu.secondes
			if (this.panneau.contenu.hasOwnProperty('affichageHeures')) {
				this.affichageHeures = this.panneau.contenu.affichageHeures
			}
		}
		if (this.mode === 'lecture' || this.mode === 'decompte') {
			this.generer()
		}
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' .minutes input').focus()
			}.bind(this))
		}
	},
	methods: {
		generer () {
			if (this.heures >= 1 || this.minutes >= 1 || this.secondes >= 1) {
				this.mode = 'lecture'
				if (this.secondes < 10) {
					this.texteSecondes = '0' + this.secondes
				} else {
					this.texteSecondes = this.secondes
				}
				if (this.minutes < 10) {
					this.texteMinutes = '0' + this.minutes
				} else {
					this.texteMinutes = this.minutes
				}
				if (this.heures < 10) {
					this.texteHeures = '0' + this.heures
				} else {
					this.texteHeures = this.heures
				}
				this.dureeMs = (((this.heures * 3600) + (this.minutes * 60) + this.secondes) * 1000) - 1000
				this.w = 46
				this.h = 55
				this.positionner()
			}
		},
		editer () {
			this.mode = 'edition'
			this.texteHeures = ''
			this.texteMinutes = ''
			this.texteSecondes = ''
			this.duree = ''
			this.dureeMs = 0
			this.tempsRestant = ''
			this.tempsEcoule = false
			if (this.statut !== '') {
				this.normaliser()
			}
			if (this.decompte !== '') {
				clearInterval(this.decompte)
				this.decompte = ''
			}
			this.w = 42
			this.h = 22.2
			this.positionner()
		},
		demarrer (laps) {
			if (laps === 0) {
				const maintenant = Date.parse(new Date())
				this.duree = new Date(maintenant + (((parseInt(this.texteHeures) * 3600) + (parseInt(this.texteMinutes) * 60) + (parseInt(this.texteSecondes) - 1)) * 1000));
			} else {
				this.duree = laps
			}
			this.decompter()
			this.decompte = setInterval(this.decompter, 1000)
			this.mode = 'decompte'
		},
		decompter () {
			const temps = this.calculerTempsRestant(this.duree)
			let audio = ''
			if (temps.secondes < 10) {
				this.texteSecondes = '0' + temps.secondes
			} else {
				this.texteSecondes = temps.secondes
			}
			if (temps.minutes < 10) {
				this.texteMinutes = '0' + temps.minutes
			} else {
				this.texteMinutes = temps.minutes
			}
			if (temps.heures < 10) {
				this.texteHeures = '0' + temps.heures
			} else {
				this.texteHeures = temps.heures
			}
			if (temps.total <= 10000 && document.querySelector('#' + this.id + ' svg')) {
				document.querySelector('#' + this.id + ' svg').classList.add('rouge')
			}
			if (temps.total <= 10000 && temps.total > 0) {
				audio = document.querySelector('#audio-bip')
				this.$lireAudio(audio)
			}
			if (temps.total <= 0) {
				clearInterval(this.decompte)
				this.tempsEcoule = true
				audio = document.querySelector('#audio-fin')
				this.$lireAudio(audio)
			}
		},
		pause () {
			clearInterval(this.decompte)
			this.tempsRestant = this.calculerTempsRestant(this.duree).total
			this.mode = 'pause'
		},
		continuer () {
			this.duree = new Date(Date.parse(new Date()) + this.tempsRestant)
			this.demarrer(this.duree)
			this.mode = 'decompte'
		},
		calculerTempsRestant (d) {
			const temps = Date.parse(d) - Date.parse(new Date())
			const secondes = Math.floor((temps / 1000) % 60)
			const minutes = Math.floor((temps / 1000 / 60) % 60)
			const heures = Math.floor((temps / 1000 / 3600) % 60)
			return { total: temps, heures: heures, minutes: minutes, secondes: secondes }
		},
		modifierAffichageHeures (affichage) {
			this.affichageHeures = affichage
		}
	}
}
</script>

<style>
.rebours {
	position: relative;
}

.rebours .heures,
.rebours .minutes,
.rebours .secondes {
	display: inline-block;
}

.rebours .heures,
.rebours .minutes {
	margin-right: 2rem;
}

.rebours .decompte {
	position: absolute;
	top: 50%;
	display: flex;
	justify-content: center;
	width: 100%;
	font-family: 'Orbitron', sans-serif;
	font-size: 5rem;
	letter-spacing: 0.5rem;
	line-height: 1;
	margin-top: -2.5rem;
	text-align: center;
	user-select: none;
}

.rebours .decompte span {
	display: inline-block;
	text-indent: 0.5rem;
}

.rebours .decompte .heures,
.rebours .decompte .minutes,
.rebours .decompte .secondes {
	width: 11rem;
	margin: 0;
}

.rebours .decompte.rouge {
	color: #ff7575;
}

.rebours + .actions .bouton {
	margin-right: 0!important;
}

.actions .bouton.danger:hover,
.actions .bouton.danger {
	color: #001d1d!important;
	background: #ff7575!important;
	cursor: default;
}

.rebours.edition + .actions {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 2rem;
}

.rebours.edition + .actions .conteneur-affichage-heures {
	margin-left: 2rem;
	text-align: center;
}

.rebours.edition + .actions .bouton {
	margin-top: 0;
}

.rebours.edition + .actions .conteneur-affichage-heures > label {
	margin-bottom: 0.5rem;
}

.rebours.edition + .actions .affichage-heures .oui {
	margin-right: 2rem;
}

.rebours.edition + .actions .affichage-heures label {
	display: inline-block;
    width: auto;
    margin-left: 1rem;
	margin-bottom: 0;
}

.rebours svg {
	transform: rotate(90deg) scale(-1, 1);
	animation-play-state: paused!important;
}

.rebours svg.actif {
	animation-play-state: running!important;
}

.rebours svg.rouge circle {
	stroke: #ff7575!important;
}

@keyframes rebours {
	to {
		stroke-dashoffset: 0;
	}
}
</style>
