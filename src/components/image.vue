<template>
	<transition name="fondu">
		<vue-drag-resize :id="id" contentClass="panneau" :class="{'deplacement': deplacement, 'max': statut === 'max', 'min': statut === 'min'}" :isDraggable="true" :isResizable="redimensionnement" dragHandle=".actif" dragCancel=".inactif" :w="$convertirRem(w)" :h="$convertirRem(h)" :minw="$convertirRem(minw)" :minh="$convertirRem(minh)" :parentW="largeurPage" :parentH="hauteurPage" :x="x" :y="y" :z="z" :sticks="['tl', 'bl', 'br']" :parentLimitation="true" @dragging="deplacer" @dragstop="redimensionner" @resizestop="redimensionner" @clicked="afficher" v-show="!chargement">
			<header class="actif">
				<div class="titre actif" :class="{'visible': statut === 'min'}" @dblclick="renommer(titre)">{{ titre }}</div>
				<div class="actions-panneau inactif">
					<span class="zoomer" role="button" tabindex="0" @click="zoomer" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">add</i></span>
					<span class="dezoomer" role="button" tabindex="0" @click="dezoomer" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">remove</i></span>
					<span class="recadrer" role="button" tabindex="0" @click="recadrer" v-if="mode === 'lecture' && statut !== 'min'"><i class="material-icons">center_focus_strong</i></span>
				</div>
				<div class="actions-panneau inactif">
					<span class="editer" role="button" tabindex="0" @click="editer" v-if="mode === 'lecture' && requete !== ''"><i class="material-icons">arrow_back</i></span>
					<span class="envoyer" role="button" tabindex="0" @click="envoyer(id)" v-if="mode === 'lecture' && $parent.pages.length > 1"><i class="material-icons">send</i></span>
					<span class="afficher" role="button" tabindex="0" @click="minimiser" v-if="statut === ''"><i class="material-icons">expand_less</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="statut === 'min'"><i class="material-icons">expand_more</i></span>
					<span class="afficher" role="button" tabindex="0" @click="maximiser" v-if="mode === 'lecture' && statut === ''"><i class="material-icons">fullscreen</i></span>
					<span class="afficher" role="button" tabindex="0" @click="normaliser" v-else-if="mode === 'lecture' && statut === 'max'"><i class="material-icons">fullscreen_exit</i></span>
					<span class="fermer" role="button" tabindex="0" @click="$emit('fermer', id)"><i class="material-icons">close</i></span>
				</div>
			</header>
			<div class="conteneur actif panneau-image">
				<div class="contenu inactif" v-if="mode === 'edition' && !chargementImage">
					<label v-if="pixabayAPIKey !== ''">{{ $t('lienImageRecherche') }}</label>
					<div class="rechercher" v-if="pixabayAPIKey !== ''">
						<input type="search" :value="image" @input="image = $event.target.value" @keydown.enter="generer">
						<span role="button" tabindex="0" :title="$t('rechercher')" class="bouton-secondaire" @click="generer"><i class="material-icons">search</i></span>
					</div>
					<div class="separateur" v-if="pixabayAPIKey !== ''"><span>{{ $t('ou') }}</span></div>
					<label>{{ $t('fichierAppareil') }}</label>
					<label class="bouton" role="button" tabindex="0" :for="'selectionner-image-' + id">{{ $t('selectionnerImage') }}</label>
					<input :id="'selectionner-image-' + id" type="file" @change="televerserImage" style="display: none" accept=".jpg, .jpeg, .png, .gif">
				</div>
				<div class="contenu inactif" v-else-if="mode === 'edition' && chargementImage">
					<div class="conteneur-chargement">
						<div class="chargement" />
					</div>
				</div>
				<div class="contenu inactif" v-else-if="mode === 'recherche'">
					<label>{{ $t('resultatsRecherche') }}</label>
					<div class="recherche">
						<div class="rechercher">
							<input type="search" :value="requete" @input="requete = $event.target.value" @keydown.enter="rechercher(1)">
							<span role="button" tabindex="0" :title="$t('rechercher')" class="bouton-secondaire" @click="rechercher(1)"><i class="material-icons">search</i></span>
						</div>
						<div class="resultats" v-if="Object.keys(resultats).length > 0">
							<div class="item" :data-w="resultat.previewWidth" :data-h="resultat.previewHeight" v-for="(resultat, index) in resultats.hits" @click="selectionnerImage(resultat.largeImageURL)" :key="'image_' + index">
								<img :src="resultat.previewURL">
							</div>
						</div>
						<div class="navigation" v-if="Object.keys(resultats).length > 0 && (page > 1 || page < (resultats.total / 12))">
							<span role="button" tabindex="0" :class="{'invisible': page < 2}" @click="modifierPage('precedente')">{{ $t('pagePrecedente') }}</span>
							<span role="button" tabindex="0" :class="{'invisible': page >= (resultats.total / 12)}" @click="modifierPage('suivante')">{{ $t('pageSuivante') }}</span>
						</div>
					</div>
				</div>
				<img :id="'image_' + id" :src="image" alt="Image" v-else>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panzoom from '@panzoom/panzoom'
import Panneau from '@/panneau'

export default {
	name: 'PImage',
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
			minw: 27,
			minh: 15,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0, zoom: 0 },
			image: '',
			pixabayAPIKey: '',
			requete: '',
			resultats: {},
			page: 1,
			panzoom: '',
			zoom: 1,
			chargementImage: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { image: this.image, requete: this.requete, page: this.page, coordonnees: this.definirCoordonnees(), zoom: this.zoom }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
			}
		},
		page: function (page) {
			this.rechercher(page)
		},
		statut: function (statut) {
			if (statut === '') {
				this.$nextTick(function () {
					// eslint-disable-next-line
					new flexImages({ selector: '.resultats', rowHeight: this.$convertirRem(6.5) })
				})
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
		if (process.env.VUE_APP_PIXABAY_API_KEY) {
			this.pixabayAPIKey = process.env.VUE_APP_PIXABAY_API_KEY
		}
		this.titre = this.$t('image')
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
			this.image = this.panneau.contenu.image
			this.requete = this.panneau.contenu.requete
			this.page = this.panneau.contenu.page
			this.zoom = this.panneau.contenu.zoom
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'edition' && this.statut !== 'min') {
			this.$nextTick(function () {
				document.querySelector('#' + this.id + ' input').focus()
			}.bind(this))
		} else if (this.mode === 'recherche') {
			this.$nextTick(function () {
				this.rechercher(this.page)
			}.bind(this))
		} else if (this.mode === 'lecture') {
			this.redimensionnement = true
			this.$nextTick(function () {
				const image = document.querySelector('#image_' + this.id)
				this.panzoom = Panzoom(image, {
					maxScale: 15,
					minScale: 0.5,
					panOnlyWhenZoomed: true
				})
				this.panzoom.zoom(this.zoom)
				if (this.panneau.contenu.hasOwnProperty('coordonnees') && this.panneau.contenu.coordonnees !== '') {
					const coordonnees = this.panneau.contenu.coordonnees
					setTimeout(function () {
						this.panzoom.pan(coordonnees.x, coordonnees.y)
					}.bind(this), 0)
				}
				image.parentElement.addEventListener('wheel', this.panzoom.zoomWithWheel)
				image.addEventListener('panzoomchange', this.modifierZoom)
			}.bind(this))
		}
	},
	methods: {
		generer () {
			if (this.$verifierURL(this.image) === true || this.image.substring(0, 10) === 'data:image') {
				this.mode = 'lecture'
				this.redimensionnement = true
				this.chargementImage = false
				this.w = 40
				this.h = 30
				if (this.donnees.w > 0 && this.donnees.h > 0) {
					this.w = this.donnees.w
					this.h = this.donnees.h
				} else {
					this.w = 40
					this.h = 30
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				if (this.donnees.zoom > 0) {
					this.zoom = this.donnees.zoom
				}
				this.positionner()
				this.$nextTick(function () {
					const image = document.querySelector('#image_' + this.id)
					this.panzoom = Panzoom(image, {
						maxScale: 15,
						minScale: 0.5,
						panOnlyWhenZoomed: true
					})
					this.panzoom.zoom(this.zoom)
					image.parentElement.addEventListener('wheel', this.panzoom.zoomWithWheel)
					image.addEventListener('panzoomchange', this.modifierZoom)
				}.bind(this))
			} else {
				this.mode = 'recherche'
				this.requete = this.image
				this.w = 40
				this.h = 35.4
				this.rechercher(1)
				this.positionner()
			}
		},
		editer () {
			this.redimensionnement = false
			this.chargementImage = false
			this.donnees.zoom = this.zoom
			this.zoom = 1
			if (this.panzoom !== '') {
				const image = document.querySelector('#image_' + this.id)
				image.removeEventListener('panzoomchange', this.modifierZoom)
				image.parentElement.removeEventListener('wheel', this.panzoom.zoomWithWheel)
				this.panzoom.destroy()
				this.panzoom = ''
			}
			if (this.statut !== '') {
				this.normaliser()
			}
			this.donnees.w = this.w
			this.donnees.h = this.h
			this.donnees.x = this.x
			this.donnees.y = this.y
			this.mode = 'recherche'
			this.w = 40
			this.h = 35.4
			this.rechercher(this.page)
			if (this.image.substring(0, 10) === 'data:image') {
				this.image = ''
			}
			this.positionner()
		},
		rechercher (page) {
			if (this.requete !== '') {
				const requete = this.requete.replace(/\s+/g, '+')
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						const donnees = JSON.parse(xhr.responseText)
						if (donnees && donnees.total > 0) {
							this.resultats = donnees
							this.$nextTick(function () {
								// eslint-disable-next-line
								new flexImages({ selector: '.resultats', rowHeight: this.$convertirRem(6.5) })
							})
						}
					}
				}.bind(this)
				if (page === 1) {
					this.page = page
				}
				xhr.open('GET', 'https://pixabay.com/api/?key=' + this.pixabayAPIKey + '&q=' + requete + '&image_type=photo&lang=fr&orientation=horizontal&safesearch=true&per_page=12&page=' + page, true)
				xhr.send()
			}
		},
		modifierPage (type) {
			if (type === 'suivante' && this.page < (this.resultats.total / 12)) {
				this.page++
			} else if (type === 'precedente' && this.page > 1) {
				this.page--
			}
		},
		selectionnerImage (image) {
			this.image = image
			this.generer()
		},
		televerserImage (event) {
			const fichier = event.target.files[0]
			if (fichier) {
				this.chargementImage = true
				const reader = new FileReader()
				reader.readAsDataURL(fichier)
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
							this.chargementImage = false
							this.image = canvas.toDataURL('image/jpeg', 0.85)
							this.generer()
						} else {
							this.chargementImage = false
							this.image = e.target.result
							this.generer()
						}
					}.bind(this)
				}.bind(this)
			}
		},
		definirCoordonnees () {
			if (this.panzoom !== '') {
				return this.panzoom.getPan()
			} else {
				return ''
			}
		},
		zoomer () {
			if (this.zoom < 15) {
				this.zoom = this.zoom + 0.1
				this.panzoom.zoom(this.zoom, { animated: true })
			}
		},
		dezoomer () {
			if (this.zoom > 0.5) {
				this.zoom = this.zoom - 0.1
				this.panzoom.zoom(this.zoom, { animated: true })
			}
		},
		recadrer () {
			this.zoom = 1
			this.panzoom.reset()
		},
		modifierZoom (event) {
			if (event.detail.scale !== this.zoom) {
				this.zoom = event.detail.scale
				this.panzoom.zoom(this.zoom, { animated: true })
			}
		}
	}
}
</script>

<style>
.panneau .panneau-image {
	border-bottom-left-radius: 1rem;
	border-bottom-right-radius: 1rem;
}

.panneau .panneau-image .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-image .chargement {
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

.panneau .panneau-image .separateur {
    position: relative;
    margin: 2rem 25% 2rem;
    text-align: center;
    width: 50%;
}

.panneau .panneau-image .separateur::before {
    position: absolute;
    top: 50%;
    display: block;
    content: '';
    width: 100%;
    height: 1px;
    background-color: #ddd;
}

.panneau .panneau-image .separateur span {
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

.panneau .panneau-image img {
	max-width: 100%;
	max-height: 100%;
	align-self: center;
	cursor: default;
}

.panneau .panneau-image label.bouton {
	width: auto!important;
    display: inline-block!important;
	margin-top: 0;
	margin-bottom: 0!important;
}
</style>
