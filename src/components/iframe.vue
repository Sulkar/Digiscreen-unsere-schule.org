<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="mode === 'lecture' && statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="mode === 'lecture' && statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-iframe" v-if="mode === 'edition' && !chargementIframe">
				<div class="contenu inactif">
					<label>{{ $t('lienContenuLigne') }}</label>
					<input type="search" :value="lien" @input="lien = $event.target.value" @keydown.enter="generer">
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
			</div>
			<div class="contenu inactif panneau-iframe chargement" v-else-if="mode === 'edition' && chargementIframe">
				<div class="conteneur-chargement">
					<div class="chargement" />
				</div>
			</div>
			<div class="conteneur actif panneau-iframe" v-else>
				<iframe :src="iframe" allowfullscreen></iframe>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PIframe',
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
			redimensionnement: false,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 30,
			minh: 22,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			lien: '',
			iframe: '',
			chargementIframe: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { lien: this.lien, iframe: this.iframe }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('contenuIntegre')
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
		if (this.panneau.statut === 'max') {
			this.maximiser()
		} else if (this.panneau.statut === 'min') {
			this.minimiser()
		}
		if (this.panneau.contenu !== '') {
			this.lien = this.panneau.contenu.lien
			this.iframe = this.panneau.contenu.iframe
		}
		if (this.mode === 'lecture') {
			this.redimensionnement = true
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' input').focus()
			}.bind(this))
		}
	},
	methods: {
		generer () {
			const regex = /<iframe(.+)<\/iframe>/g
			if (regex.test(this.lien) === true) {
				this.lien = this.lien.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
			}
			if (this.$verifierURL(this.lien) === true) {
				this.chargementIframe = true
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						const donnees = JSON.parse(xhr.responseText)
						if (donnees.hasOwnProperty('error')) {
							this.iframe = this.lien
						} else if (donnees.provider_name.toLowerCase() === 'learningapps.org') {
							donnees.html = donnees.html.replace('http://LearningApps.org', 'https://learningapps.org')
							this.iframe = donnees.html.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
						} else {
							this.iframe = donnees.html.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
						}
						this.mode = 'lecture'
						this.redimensionnement = true
						this.chargementIframe = false
						if (this.donnees.w > 0 && this.donnees.h > 0) {
							this.w = this.donnees.w
							this.h = this.donnees.h
						} else {
							this.w = 50
							this.h = 40
						}
						if (this.donnees.x > 0 && this.donnees.y > 0) {
							this.x = this.donnees.x
							this.y = this.donnees.y
						}
						this.positionner()
					} else {
						this.chargementIframe = false
						this.iframe = this.lien
					}
				}.bind(this)
				xhr.onerror = function () {
					this.chargementIframe = false
					this.iframe = this.lien
				}
				xhr.open('GET', 'https://noembed.com/embed?url=' + this.lien, true)
				xhr.send()
			}
		}
	}
}
</script>

<style>
.panneau .panneau-iframe {
	overflow: auto!important;
}

.panneau .panneau-iframe iframe {
	border-bottom-left-radius: 1rem;
    border-bottom-right-radius: 1rem;
}

.panneau .panneau-iframe.contenu.chargement {
	display: flex;
	justify-content: center;
	align-items: center;
	height: calc(100% - 6rem);
}

.panneau .panneau-iframe .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-iframe .conteneur-chargement .chargement {
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
</style>
