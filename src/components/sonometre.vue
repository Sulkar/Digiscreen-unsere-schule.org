<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="false" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="[]" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="$parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-sonometre">
				<div class="contenu inactif">
					<div class="volume">
						<span class="vert" :style="{'width': volume + '%'}" v-if="volume < sensibilite" />
						<span class="rouge" :style="{'width': volume + '%'}" v-else />
					</div>
					<label>{{ $t('sensibilite') }}</label>
					<div class="sensibilite">
						<span @click="modifierSensibilite(95)" :class="{'selectionne': sensibilite === 95 }">1</span>
						<span @click="modifierSensibilite(85)" :class="{'selectionne': sensibilite === 85 }">2</span>
						<span @click="modifierSensibilite(75)" :class="{'selectionne': sensibilite === 75 }">3</span>
						<span @click="modifierSensibilite(65)" :class="{'selectionne': sensibilite === 65 }">4</span>
						<span @click="modifierSensibilite(55)" :class="{'selectionne': sensibilite === 55 }">5</span>
						<span @click="modifierSensibilite(45)" :class="{'selectionne': sensibilite === 45 }">6</span>
						<span @click="modifierSensibilite(35)" :class="{'selectionne': sensibilite === 35 }">7</span>
					</div>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="demarrer" v-if="verificationVolume === ''">{{ $t('demarrer') }}</span>
						<span class="bouton" role="button" tabindex="0" @click="pause" v-else>{{ $t('pause') }}</span>
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
	name: 'PSonometre',
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
			mode: 'lecture',
			deplacement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 40,
			minh: 24,
			statut: '',
			dimensions: {},
			contexteAudio: '',
			sourceAudio: '',
			analyseur: '',
			volumes: [],
			volume: 0,
			sensibilite: 95,
			verificationVolume: ''
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, statut: this.statut, dimensions: this.dimensions, contenu: '', w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('sonometre')
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
		if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
	},
	beforeDestroy () {
		this.pause()
		if (this.analyseur !== '') {
			this.analyseur.disconnect()
		}
	},
	methods: {
		modifierSensibilite (sensibilite) {
			this.sensibilite = sensibilite
		},
		demarrer () {
			if (this.verificationVolume === '') {
				navigator.mediaDevices.getUserMedia({ audio: true }).then(function (fluxAudio) {
					this.genererFlux(fluxAudio)
					if (this.volumes.length > 0) {
						this.verificationVolume = setInterval(this.dessinerFlux, 100)
					} else {
						alert(this.$t('erreurSonometre'))
					}
				}.bind(this)).catch(function () {
					alert(this.$t('erreurSonometre'))
				}.bind(this))
			}
		},
		pause () {
			if (this.verificationVolume !== '') {
				clearInterval(this.verificationVolume)
				this.verificationVolume = ''
			}
		},
		genererFlux (fluxAudio) {
			this.contexteAudio = new AudioContext()
			this.sourceAudio = this.contexteAudio.createMediaStreamSource(fluxAudio)
			this.analyseur = this.contexteAudio.createAnalyser()
			this.analyseur.fftSize = 512
			this.analyseur.minDecibels = -127
			this.analyseur.maxDecibels = 0
			this.analyseur.smoothingTimeConstant = 0.4
			this.sourceAudio.connect(this.analyseur)
			this.volumes = new Uint8Array(this.analyseur.frequencyBinCount)
		},
		dessinerFlux () {
			this.analyseur.getByteFrequencyData(this.volumes)
			let additionVolume = 0
			for (const volume of this.volumes) {
				additionVolume += volume
			}
			const volumeMoyen = additionVolume / this.volumes.length
			this.volume = (volumeMoyen * 100) / 127
		}
	}
}
</script>

<style>
.panneau .panneau-sonometre .volume {
	border: 1px solid #ddd;
	width: 100%;
	height: 3rem;
	margin-bottom: 2rem;
}

.panneau .panneau-sonometre .volume span {
	display: block;
	height: 100%;
	transition: width 100ms linear;
}

.panneau .panneau-sonometre .volume span.vert {
	background: #00b894;
}

.panneau .panneau-sonometre .volume span.rouge {
	background: #ff7575;
}

.panneau .panneau-sonometre .sensibilite {
	display: flex;
	justify-content: center;
}

.panneau .panneau-sonometre .sensibilite span {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 3.2rem;
	height: 3.2rem;
	margin-right: 1rem;
	font-size: 1.7rem;
	border-radius: 50%;
	background: #00ced1;
	color: #001d1d;
	cursor: pointer;
}

.panneau .panneau-sonometre .sensibilite span.selectionne {
	background: #444;
	color: #fff;
}

.panneau .panneau-sonometre .sensibilite span:last-child {
	margin-right: 0;
}
</style>
