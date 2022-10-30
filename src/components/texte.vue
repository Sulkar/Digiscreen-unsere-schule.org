<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement" :style="{'background': definirCouleurFond()}">
			<header class="actif">
				<div class="titre actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="zoomer" role="button" tabindex="0" @click="augmenterTaille" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">add</i></span>
					<span class="dezoomer" role="button" tabindex="0" @click="reduireTaille" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">remove</i></span>
					<span class="recadrer" role="button" tabindex="0" @click="annulerTaille" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">center_focus_strong</i></span>
				</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="mode === 'edition' && statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="mode === 'edition' && statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur panneau-texte actif">
				<div class="contenu inactif edition" v-if="mode === 'edition'">
					<div class="editeur" :style="{'font-size': $convertirRem(taille) + 'px'}" />
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<div class="contenu actif" v-else>
					<div class="texte" :style="{'font-size': $convertirRem(taille) + 'px'}" v-html="texte" />
				</div>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import pell from 'pell'
import Panneau from '@/panneau'

export default {
	name: 'PTexte',
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
			redimensionnement: true,
			titre: '',
			id: '',
			w: 0,
			h: 0,
			x: 0,
			y: 0,
			z: 0,
			minw: 53,
			minh: 46,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			editeur: '',
			texte: '',
			taille: 3.2,
			couleurFond: '#ffffff'
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { texte: this.texte, taille: this.taille, couleurFond: this.couleurFond }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('texte')
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
		if (typeof this.panneau.contenu === 'object' && this.panneau.contenu.constructor === Object) {
			this.texte = this.panneau.contenu.texte
			this.taille = this.panneau.contenu.taille
			this.couleurFond = this.panneau.contenu.couleurFond
		} else if (this.panneau.contenu !== '') {
			this.texte = this.panneau.contenu
		}
		if (this.mode === 'lecture') {
			this.minw = 23
			this.minh = 8
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition') {
			this.$nextTick(function () {
				this.creer()
				document.getElementsByClassName('pell-content')[0].focus()
			}.bind(this))
		}
	},
	beforeDestroy () {
		if (document.querySelector('#couleur-texte-' + this.id)) {
			document.querySelector('#couleur-texte-' + this.id).removeEventListener('change', this.modifierCouleurTexte)
		}
		if (document.querySelector('#couleur-fond-' + this.id)) {
			document.querySelector('#couleur-fond-' + this.id).removeEventListener('change', this.modifierCouleurFond)
		}
	},
	methods: {
		generer () {
			if (this.texte !== '') {
				this.mode = 'lecture'
				this.editeur = ''
				if (this.donnees.w > 0 && this.donnees.h > 0) {
					this.w = this.donnees.w
					this.h = this.donnees.h
				} else {
					this.w = 30
					this.h = 20
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.minw = 23
				this.minh = 8
				this.positionner()
				this.$nextTick(function () {
					window.MathJax.typeset()
				})
			}
		},
		editer () {
			this.mode = 'edition'
			this.$nextTick(function () {
				this.creer()
				if (this.statut !== '') {
					this.normaliser()
				}
				this.donnees.w = this.w
				this.donnees.h = this.h
				this.donnees.x = this.x
				this.donnees.y = this.y
				this.w = 53
				this.h = 46
				this.positionner()
				this.$nextTick(function () {
					this.minw = 53
					this.minh = 46
				}.bind(this))
			}.bind(this))
		},
		creer () {
			const that = this
			this.editeur = pell.init({
				element: document.querySelector('#' + this.id + ' .editeur'),
				onChange: function (texte) {
					this.texte = texte
				}.bind(this),
				actions: [
					{ name: 'taille-plus', title: that.$t('tailleTextePlus'), icon: '<i class="material-icons">add</i>', result: () => that.augmenterTaille() },
					{ name: 'taille-moins', title: that.$t('tailleTexteMoins'), icon: '<i class="material-icons">remove</i>', result: () => that.reduireTaille() },
					{ name: 'gras', title: that.$t('gras'), icon: '<i class="material-icons">format_bold</i>', result: () => pell.exec('bold') },
					{ name: 'italique', title: that.$t('italique'), icon: '<i class="material-icons">format_italic</i>', result: () => pell.exec('italic') },
					{ name: 'souligne', title: that.$t('souligne'), icon: '<i class="material-icons">format_underlined</i>', result: () => pell.exec('underline') },
					{ name: 'barre', title: that.$t('barre'), icon: '<i class="material-icons">format_strikethrough</i>', result: () => pell.exec('strikethrough') },
					{ name: 'listedecimale', title: that.$t('listeDecimale'), icon: '<i class="material-icons">format_list_numbered</i>', result: () => pell.exec('insertOrderedList') },
					{ name: 'liste', title: that.$t('liste'), icon: '<i class="material-icons">format_list_bulleted</i>', result: () => pell.exec('insertUnorderedList') },
					{ name: 'aligner-gauche', title: that.$t('alignerGauche'), icon: '<i class="material-icons">format_align_left</i>', result: () => pell.exec('JustifyLeft') },
					{ name: 'centrer', title: that.$t('centrer'), icon: '<i class="material-icons">format_align_center</i>', result: () => pell.exec('JustifyCenter') },
					{ name: 'couleur-texte', title: that.$t('couleurTexte'), icon: '<label for="couleur-texte-' + this.id + '"><i class="material-icons">format_color_text</i></label><input id="couleur-texte-' + this.id + '" type="color">', result: () => void 0 },
					{ name: 'couleur-fond', title: that.$t('couleurFond'), icon: '<label for="couleur-fond-' + this.id + '"><i class="material-icons">format_color_fill</i></label><input id="couleur-fond-' + this.id + '" type="color" value="' + this.couleurFond + '">', result: () => void 0 }
				]
			})
			this.editeur.onpaste = function (event) {
				event.preventDefault()
				event.stopPropagation()
				const texte = event.clipboardData.getData('text/plain')
				pell.exec('insertText', texte)
			}
			this.editeur.content.innerHTML = this.texte
			document.querySelector('#' + this.id + ' .editeur .pell-content').style.backgroundColor = this.couleurFond
			document.querySelector('#couleur-texte-' + this.id).addEventListener('change', this.modifierCouleurTexte)
			document.querySelector('#couleur-fond-' + this.id).addEventListener('change', this.modifierCouleurFond)
		},
		modifierCouleurTexte (event) {
			pell.exec('foreColor', event.target.value)
		},
		modifierCouleurFond (event) {
			document.querySelector('#' + this.id + ' .editeur .pell-content').style.backgroundColor = event.target.value
			this.couleurFond = event.target.value
		},
		definirCouleurFond () {
			if (this.mode === 'lecture') {
				return this.couleurFond
			} else {
				return '#fff'
			}
		},
		augmenterTaille () {
			if (this.taille < 10) {
				this.taille = this.taille + 0.2
			}
		},
		reduireTaille () {
			if (this.taille > 1) {
				this.taille = this.taille - 0.2
			}
		},
		annulerTaille () {
			this.taille = 3.2
		}
	}
}
</script>

<style>
.panneau .panneau-texte .contenu {
	width: auto!important;
}

.panneau .panneau-texte .edition {
	width: 100%;
	height: 100%;
}

.panneau .panneau-texte .texte {
	font-weight: 400;
	line-height: 1.4;
	user-select: none;
}

.editeur {
	height: calc(100% - 6rem);
	border-bottom: 1px solid #ddd;
}

.editeur,
.pell-content {
    box-sizing: border-box;
}

.pell-content {
    height: calc(100% - 4.5rem);
	width: 100%;
	outline: 0;
	line-height: 1.5;
	padding: 2rem 1rem;
	text-align: left;
	overflow: auto;
	cursor: text;
}

.pell-actionbar {
	display: flex;
	justify-content: center;
	align-items: center;
    background-color: #fff;
	border-bottom: 1px solid #ddd;
	height: 4.5rem;
}

.pell-button {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 2.4rem;
    height: 3.4rem;
    outline: 0;
    width: auto;
	padding: 0 0.5rem;
	background-color: transparent;
    border: none;
    cursor: pointer;
}

.pell-button-selected {
    background-color: #f0f0f0;
}

.pell-button label {
	font-size: 2.2rem!important;
	font-weight: 400!important;
	margin: 0!important;
	width: 2.2rem!important;
}

.pell-button input[type="color"] {
	width: 2rem;
	height: 2rem;
	border: none;
	margin-left: 0.5rem;
	cursor: pointer;
}

.pell-button input[type="color"]::-moz-color-swatch {
	border: 1px solid #ddd;
	border-radius: 50%;
}

.pell-button input[type="color"]::-webkit-color-swatch {
	border: 1px solid #ddd;
	border-radius: 50%;
}

.pell-button input[type="color"]::-webkit-color-swatch-wrapper {
	padding: 0;
}
</style>
