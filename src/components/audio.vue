<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="false" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="[]" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-audio">
				<div class="contenu inactif" v-if="mode === 'edition' && !chargementAudio">
					<label>{{ $t('lienFichierAudio') }}</label>
					<div class="valider">
						<input type="search" :value="audio" @input="audio = $event.target.value" @keydown.enter="valider">
						<span role="button" tabindex="0" :title="$t('valider')" class="bouton-secondaire" @click="valider"><i class="material-icons">search</i></span>
					</div>
					<div class="separateur"><span>{{ $t('ou') }}</span></div>
					<label>{{ $t('fichierAppareil') }}</label>
					<label class="bouton" role="button" tabindex="0" :for="'selectionner-audio-' + id">{{ $t('selectionnerAudio') }}</label>
					<input :id="'selectionner-audio-' + id" type="file" @change="televerserAudio" style="display: none" accept=".mp3, .wav, .m4a, .ogg">
				</div>
				<div class="contenu inactif" v-else-if="mode === 'edition' && chargementAudio">
					<div class="conteneur-chargement">
						<div class="chargement" />
					</div>
				</div>
				<div class="contenu inactif" v-else-if="mode === 'vitesse'">
					<audio controls :src="audio"></audio>
					<label>{{ $t('vitesseLecture') }}</label>
					<div class="vitesse">
						<input type="range" :min="0.5" :max="2" :value="vitesse" :step="0.1" @change="modifierVitesse">
						<span class="valeur">{{ vitesse }}</span>
					</div>
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<audio controls :src="audio" v-else></audio>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PAudio',
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
			minw: 40,
			minh: 14,
			statut: '',
			dimensions: {},
			donnees: { x: 0, y: 0 },
			audio: '',
			dataURL: '',
			vitesse: 1,
			chargementAudio: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { audio: this.audio, dataURL: this.dataURL, vitesse: this.vitesse }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('audio')
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
			if (this.panneau.contenu.dataURL) {
				this.dataURL = this.panneau.contenu.dataURL
			}
			if (this.dataURL !== '') {
				const blob = this.convertirDataURL(this.dataURL)
				this.audio = window.URL.createObjectURL(blob)
			} else {
				this.audio = this.panneau.contenu.audio
			}
			this.vitesse = this.panneau.contenu.vitesse
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' input').focus()
			}.bind(this))
		} else if (this.mode === 'lecture') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' audio').playbackRate = this.vitesse
			}.bind(this))
		}
	},
	beforeDestroy () {
		if (this.dataURL !== '' && this.audio !== '') {
			window.URL.revokeObjectURL(this.audio)
		}
	},
	methods: {
		valider () {
			if (this.$verifierURL(this.audio) === true) {
				this.mode = 'vitesse'
				this.w = 40
				this.h = 27
			}
		},
		generer () {
			this.mode = 'lecture'
			this.w = 40
			this.h = 14
			if (this.donnees.x > 0 && this.donnees.y > 0) {
				this.x = this.donnees.x
				this.y = this.donnees.y
			}
			this.positionner()
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' audio').playbackRate = this.vitesse
			}.bind(this))
		},
		editer () {
			this.mode = 'vitesse'
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 40
			this.h = 27
			this.positionner()
		},
		modifierVitesse (event) {
			const vitesse = event.target.value
			document.querySelector('#' + this.id + ' audio').playbackRate = vitesse
			this.vitesse = vitesse
		},
		televerserAudio (event) {
			const fichier = event.target.files[0]
			if (fichier) {
				this.chargementAudio = true
				const reader = new FileReader()
				reader.readAsDataURL(fichier)
				reader.onloadend = function (e) {
					this.chargementAudio = false
					this.dataURL = e.target.result
					this.audio = window.URL.createObjectURL(fichier)
					this.mode = 'vitesse'
					this.w = 40
					this.h = 27
				}.bind(this)
			}
		},
		convertirDataURL (dataurl) {
			let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n)
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n)
			}
			return new Blob([u8arr], { type:mime })
		}
	}
}
</script>

<style>
.panneau .panneau-audio audio {
	width: 100%;
	outline: none;
}

.panneau .panneau-audio audio + label {
	margin-top: 2rem;
}

.panneau .panneau-audio .valider {
	display: flex;
}

.panneau .panneau-audio .valider .bouton-secondaire {
    width: auto!important;
    margin-left: 0.5rem;
    height: 4rem!important;
}

.panneau .panneau-audio .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-audio .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-audio .chargement {
	display: inline-block;
	border: 7px solid #ddd;
	border-top: 7px solid #00ced1;
	border-radius: 50%;
	width: 45px;
	height: 45px;
	animation: rotation 0.7s linear infinite;
}
  
@keyframes rotation {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.panneau .panneau-audio .separateur {
    position: relative;
    margin: 2rem 25% 2rem;
    text-align: center;
    width: 50%;
}

.panneau .panneau-audio .separateur::before {
    position: absolute;
    top: 50%;
    display: block;
    content: '';
    width: 100%;
    height: 1px;
    background-color: #ddd;
}

.panneau .panneau-audio .separateur span {
    position: relative;
    margin: 0;
    font-size: 1.5rem;
    z-index: 2;
    display: inline-block;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    vertical-align: middle;
    background-color: #fff;
}

.panneau .panneau-audio label.bouton {
	width: auto!important;
    display: inline-block!important;
	margin-top: 0;
	margin-bottom: 0!important;
}

.panneau .conteneur .vitesse + .bouton {
	margin-top: 0;
}
</style>
