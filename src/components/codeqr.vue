<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
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
			<div class="conteneur actif panneau-codeqr">
				<div class="contenu inactif">
					<label v-if="mode === 'edition'">{{ $t('lienOuTexte') }}</label>
					<input type="search" :maxlength="256" :value="texte" @input="texte = $event.target.value" v-if="mode === 'edition'">
					<input type="text" class="domaine" :value="lien" disabled v-else-if="mode === 'lecture' && lien !== ''">
					<div :id="'qr_' + id" class="codeqr" :class="{'edition': mode === 'edition'}" />
					<span class="bouton" role="button" tabindex="0" @click="generer" v-if="mode === 'edition'">{{ $t('valider') }}</span>
				</div>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PCodeQR',
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
			minh: 32,
			statut: '',
			dimensions: {},
			donnees: { x: 0, y: 0 },
			codeqr: '',
			texte: 'https://unsere-schule.org/',
			lien: ''
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: this.texte, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
			}
		},
		deplacement: function (valeur) {
			if (valeur === false && this.mode === 'lecture') {
				const rect = document.querySelector('#' + this.id + ' .codeqr').getBoundingClientRect()
				this.codeqr.width = rect.width
				this.codeqr.height = rect.width
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
		this.titre = this.$t('codeqr')
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
			this.texte = this.panneau.contenu
			if (this.$verifierURL(this.texte) === true) {
				this.lien = this.texte.replace('http://','').replace('https://','')
			}
		}
		this.positionner()
	},
	mounted () {
		const texte = this.texte
		// eslint-disable-next-line
		this.codeqr = new QRCode('qr_' + this.id, {
			text: texte,
			width: this.$convertirRem(100),
			height: this.$convertirRem(100),
			colorDark: '#000000',
			colorLight: '#ffffff',
			// eslint-disable-next-line
			correctLevel : QRCode.CorrectLevel.H
		})
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' input').focus()
				document.querySelector('#' + this.id + ' input').select()
			}.bind(this))
		}
	},
	methods: {
		generer () {
			if (this.texte !== '') {
				this.codeqr.makeCode(this.texte)
				if (this.$verifierURL(this.texte) === true) {
					this.lien = this.texte.replace('http://','').replace('https://','')
					if (this.donnees.w > 0 && this.donnees.h > 0) {
						this.w = this.donnees.w
						this.h = this.donnees.h
					} else {
						this.w = 30
						this.h = 38
					}
				} else {
					if (this.donnees.w > 0 && this.donnees.h > 0) {
						this.w = this.donnees.w
						this.h = this.donnees.h
					} else {
						this.w = 30
						this.h = 32
					}
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.mode = 'lecture'
				this.redimensionnement = true
				this.positionner()
			}
		},
		editer () {
			this.mode = 'edition'
			this.redimensionnement = false
			this.lien = ''
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.w = this.w
			this.donnees.h = this.h
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 36
			this.h = 46
			this.positionner()
		}
	}
}
</script>

<style>
.panneau .conteneur .codeqr {
	margin: 0 auto;
}

.panneau .conteneur input + .codeqr {
	margin: 2rem auto 0;
}

.panneau .conteneur .codeqr img {
	display: inline-block!important;
	max-width: 100%;
}

.panneau .conteneur .codeqr.edition img {
	max-height: 25rem!important;
}

.panneau .conteneur input.domaine {
	text-align: center;
}
</style>
