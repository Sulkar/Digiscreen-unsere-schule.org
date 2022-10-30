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
			<div class="conteneur actif panneau-lien" v-if="mode === 'edition'">
				<div class="contenu inactif" v-show="!chargementIcone">
					<label>{{ $t('lien') }}</label>
					<input type="search" class="lien" :value="lien" @input="lien = $event.target.value" @keydown.enter="generer">
                    <label>{{ $t('titreLien') }}</label>
                    <input type="search" class="titre-lien" :value="titreLien" @input="titreLien = $event.target.value" @keydown.enter="generer">
					<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
				</div>
				<div class="contenu inactif" v-show="chargementIcone">
					<div class="conteneur-chargement">
						<div class="chargement" />
					</div>
				</div>
			</div>
			<div class="conteneur actif panneau-lien" v-else>
				<label v-if="titreLien !== ''">{{ titreLien }}</label>
				<a class="icone" :href="lien" target="_blank" rel="noreferrer" v-if="icone === 'defaut'"><i class="material-icons">open_in_new</i></a>
				<a class="favicon" :href="lien" target="_blank" rel="noreferrer" v-else><img :src="icone" :width="60" :height="60" :alt="titreLien"></a>
			</div>
		</vue-drag-resize>
	</transition>
</template>

<script>
import VueDragResize from 'vue-drag-resize'
import Panneau from '@/panneau'

export default {
	name: 'PLien',
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
			minw: 22,
			minh: 18,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			lien: '',
			titreLien: '',
			icone: 'defaut',
			chargementIcone: false
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { lien: this.lien, titreLien: this.titreLien, icone: this.icone }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('lien')
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
			this.lien = this.panneau.contenu.lien
			this.titreLien = this.panneau.contenu.titreLien
			if (this.panneau.contenu.icone) {
				this.icone = this.panneau.contenu.icone
			}
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
			if (this.$verifierURL(this.lien) === true) {
				this.chargementIcone = true
				let domaine = new URL(this.lien)
				domaine = domaine.hostname
				const xhr = new XMLHttpRequest()
				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE && xhr.status === 200) {
						const donnees = xhr.responseText
						if (donnees !== '') {
							this.icone = 'https://ladigitale.dev/favicons' + donnees.substring(1)
						} else {
							this.icone = 'defaut'
						}
						this.mode = 'lecture'
						this.w = 22
						this.h = 18
						if (this.titreLien !== '') {
							this.titre = this.titreLien
						} else {
							this.titre = this.$t('lien')
						}
						this.positionner()
					}
					this.chargementIcone = false
				}.bind(this)
				xhr.open('POST', 'https://ladigitale.dev/favicons/recuperer_icone.php', true)
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
				xhr.send('lien=' + domaine)
			}
		},
		editer () {
			this.mode = 'edition'
			if (this.statut !== '') {
				this.normaliser()
			}
			this.w = 40
			this.h = 28
		}
	}
}
</script>

<style>
.panneau .panneau-lien {
	text-align: center;
}

.panneau .panneau-lien .conteneur-chargement {
	font-size: 0;
	line-height: 1;
	text-align: center;
}

.panneau .panneau-lien .chargement {
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

.panneau .panneau-lien input.lien {
	margin-bottom: 2rem;
}

.panneau .panneau-lien a.icone {
	font-size: 7.2rem;
}

.panneau .panneau-lien a.favicon {
	font-size: 0;
}
</style>
