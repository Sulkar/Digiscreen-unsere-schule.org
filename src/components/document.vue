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
			<div class="conteneur actif panneau-document" v-if="mode === 'edition'">
				<div class="contenu inactif" v-if="!chargementDocument">
					<label>{{ $t('documentAppareil') }}</label>
					<label class="bouton" role="button" tabindex="0" :for="'selectionner-document-' + id">{{ $t('selectionnerDocument') }}</label>
					<input :id="'selectionner-document-' + id" type="file" @change="televerserDocument" style="display: none" accept=".pdf, .ods, .odt, .odp, .odg">
				</div>
				<div class="contenu inactif" v-else>
					<div class="conteneur-chargement">
						<div class="chargement" />
					</div>
				</div>
			</div>
			<div class="conteneur actif panneau-document" v-else>
				<iframe :src="'./static/pdf/web/viewer.html?file=' + document" allowfullscreen v-if="type === 'pdf'"></iframe>
				<iframe :src="'./static/viewer/#' + document" allowfullscreen v-else></iframe>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PDocument',
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
			minw: 40,
			minh: 16,
			statut: '',
			dimensions: {},
			document: '',
			dataURL: '',
			type: '',
			chargementDocument: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { document: this.document, dataURL: this.dataURL, type: this.type }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('document')
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
			this.type = this.panneau.contenu.type
			if (this.type === 'pdf') {
				this.dataURL = this.panneau.contenu.dataURL
				const blob = this.convertirDataURL(this.dataURL)
				this.document = window.URL.createObjectURL(blob)
			} else {
				this.document = this.panneau.contenu.document
			}
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
		if (this.mode === 'lecture') {
			this.redimensionnement = true
		}
	},
	beforeDestroy () {
		if (this.type === 'pdf' && this.document !== '') {
			window.URL.revokeObjectURL(this.document)
		}
	},
	methods: {
		generer () {
			this.mode = 'lecture'
			this.redimensionnement = true
			this.w = 50
			this.h = 35
			this.positionner()
		},
		televerserDocument (event) {
			const fichier = event.target.files[0]
			if (fichier) {
				const extension = fichier.name.substring(fichier.name.lastIndexOf('.') + 1)
				if (extension.toLowerCase() === 'pdf') {
					this.chargementDocument = true
					this.type = 'pdf'
					const reader = new FileReader()
					reader.readAsDataURL(fichier)
					reader.onloadend = function (e) {
						this.chargementDocument = false
						this.dataURL = e.target.result
						this.document = window.URL.createObjectURL(fichier)
						this.generer()
					}.bind(this)
				} else if (extension.toLowerCase() === 'odt' || extension.toLowerCase() === 'odp' || extension.toLowerCase() === 'ods' || extension.toLowerCase() === 'odg') {
					if (fichier.size < 1024000) {
						this.chargementDocument = true
						this.type = 'doc'
						const reader = new FileReader()
						reader.readAsDataURL(fichier)
						reader.onloadend = function (e) {
							this.chargementDocument = false
							this.document = e.target.result
							this.generer()
						}.bind(this)
					} else {
						alert(this.$t('erreurTailleFichier'))
					}
				}
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
.panneau .panneau-document {
	border-bottom-left-radius: 1rem;
	border-bottom-right-radius: 1rem;
}

.panneau .panneau-document .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-document .chargement {
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

.panneau .panneau-document label.bouton {
	width: auto!important;
    display: inline-block!important;
	margin-top: 0;
	margin-bottom: 0!important;
}
</style>
