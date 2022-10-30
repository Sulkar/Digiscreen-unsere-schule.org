<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre sans-zoom actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture'"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="mode === 'lecture' && statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="mode === 'lecture' && statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur panneau-tirage-image actif">
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('texteTirageImage') }}</label>
					<div class="zone" @dragover.prevent @drop.prevent>
						<input :id="'selectionner-images-' + id" type="file" multiple @change="selectionnerImages" style="display: none;">
						<label :for="'selectionner-images-' + id" @drop="glisserImages">{{ $t('selectionnerImages') }}</label>
					</div>
					<div class="images">
						<div class="image" v-for="(image, index) in images" :key="'image_' + index">
							<img :src="image" :alt="'Image' + index">
							<span class="fermer" @click="supprimerImage(index)"><i class="material-icons">highlight_off</i></span>
						</div>
					</div>
					<label>{{ $t('supprimerItemTirage') }}</label>
					<div class="choix">
						<span class="oui">
							<input type="radio" :id="'choix_oui_' + id" :name="'choix_oui_' + id" value="oui" :checked="suppression === 'oui'" @change="suppression = $event.target.value">
							<label :for="'choix_oui_' + id">{{ $t('oui') }}</label>
						</span>
						<span class="non">
							<input type="radio" :id="'choix_non_' + id" :name="'choix_oui_' + id" value="non" :checked="suppression === 'non'" @change="suppression = $event.target.value">
							<label :for="'choix_non_' + id">{{ $t('non') }}</label>
						</span>
					</div>
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<div class="contenu inactif lecture" v-else>
					<div class="tirage" v-if="tirage !== 'tirage'" :class="{'tirage-en-cours': tirageEnCours}">
						<img :src="tirage" alt="Image">
					</div>
					<div class="tirage texte" v-else>
						✨✨✨
					</div>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="tirer" v-if="items.length > 1">{{ $t('tirer') }}</span>
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
	name: 'PTirageImage',
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
			minh: 20,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			images: [],
			items: [],
			tirage: '',
			zone: false,
			suppression: 'non',
			tirageEnCours: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { images: this.images, suppression: this.suppression }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('tirageSortImage')
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
			this.images = this.panneau.contenu.images
			this.suppression = this.panneau.contenu.suppression
		}
		if (this.mode === 'lecture' && this.images.length > 0) {
			this.redimensionnement = true
			this.creer()
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		generer () {
			if (this.images.length > 1) {
				this.mode = 'lecture'
				this.redimensionnement = true
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
				this.creer()
			}
		},
		creer () {
			let items = JSON.parse(JSON.stringify(this.images))
			items = items.filter((item, i, ar) => ar.indexOf(item) === i)
			items = this.$melanger(items)
			this.items = items
			this.tirage = 'tirage'
		},
		tirer () {
			if (this.suppression === 'oui') {
				this.items.forEach(function (item, index) {
					if (item === this.tirage) {
						this.items.splice(index, 1)
					}
				}.bind(this))
			}
			const tirageEnCours = setInterval(function () {
				let tirage = this.items[Math.floor(Math.random() * this.items.length)]
				this.tirage = tirage
				this.tirageEnCours = true
			}.bind(this), 70)
			setTimeout(function () {
				clearInterval(tirageEnCours)
				this.tirageEnCours = false
			}.bind(this), 1500)
		},
		editer () {
			this.mode = 'edition'
			this.redimensionnement = false
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.w = this.w
			this.donnees.h = this.h
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.w = 60
			this.h = 40
			this.positionner()
		},
		selectionnerImages (event) {
			for (let i = 0; i < event.target.files.length; i++) {
				const reader = new FileReader()
				reader.readAsDataURL(event.target.files[i])
				reader.onloadend = function (e) {
					const img = new Image()
					img.src = e.target.result
					img.onload = function () {
						if (img.width > 1200) {
							const canvas = document.createElement('canvas')
							const ratio = img.width / img.height
							const largeur = 1200
							const hauteur = 1200 / ratio
							canvas.width = largeur
							canvas.height = hauteur
							canvas.getContext('2d').drawImage(img, 0, 0, largeur, hauteur)
							this.images.push(canvas.toDataURL('image/jpeg', 0.85))
						} else {
							this.images.push(e.target.result)
						}
					}.bind(this)
				}.bind(this)
			}
		},
		glisserImages (event) {
			for (let i = 0; i < event.dataTransfer.files.length; i++) {
				const reader = new FileReader()
				reader.readAsDataURL(event.dataTransfer.files[i])
				reader.onloadend = function (e) {
					const img = new Image()
					img.src = e.target.result
					img.onload = function () {
						if (img.width > 1200) {
							const canvas = document.createElement('canvas')
							const ratio = img.width / img.height
							const largeur = 1200
							const hauteur = 1200 / ratio
							canvas.width = largeur
							canvas.height = hauteur
							canvas.getContext('2d').drawImage(img, 0, 0, largeur, hauteur)
							this.images.push(canvas.toDataURL('image/jpeg', 0.85))
						} else {
							this.images.push(e.target.result)
						}
					}.bind(this)
				}.bind(this)
			}
		},
		supprimerImage (index) {
			this.images.splice(index, 1)
		}
	}
}
</script>

<style>
.panneau .panneau-tirage-image .contenu.lecture {
	width: 100%;
	height: 100%;
}

.panneau .panneau-tirage-image .zone {
	height: 7rem;
	border: 2px dashed #00ced1;
	cursor: pointer;
}

.panneau .panneau-tirage-image .zone label {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	Height: 100%;
	font-weight: 700;
	font-size: 1.4rem;
	text-transform: uppercase;
	margin-bottom: 0;
}

.panneau .panneau-tirage-image .images {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	flex-wrap: wrap;
	padding: 1rem;
}

.panneau .panneau-tirage-image .images .image {
	position: relative;
	margin: 1rem;
	padding: 0.5rem;
	border: 1px solid #ddd;
}

.panneau .panneau-tirage-image .images .image img {
	width: 8.8rem;
	height: auto;
}

.panneau .panneau-tirage-image .images .image .fermer {
	position: absolute;
	top: -1.1rem;
	right: -1.1rem;
	font-size: 2.2rem;
	color: #777;
	background: #fff;
	border-radius: 50%;
	line-height: 1;
	cursor: pointer;
}

.panneau .panneau-tirage-image .oui {
	margin-right: 2.5rem;
}

.panneau .panneau-tirage-image .choix label {
	display: inline-block;
    width: auto;
    margin-left: 1rem;
	margin-bottom: 0;
}

.panneau .panneau-tirage-image div.tirage {
    display: flex;
    justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	width: 100%;
	height: calc(100% - 6rem);
	background: #fff;
}

.panneau .panneau-tirage-image div.tirage.texte {
	display: flex;
    justify-content: center;
	align-items: center;
	font-size: 5rem;
	font-weight: 400;
}

.panneau .panneau-tirage-image div.tirage img {
    max-width: 100%;
	max-height: 100%;
	align-self: center;
}

.panneau .panneau-tirage-image div.tirage.tirage-en-cours img {
	opacity: 0.25;
}
</style>
