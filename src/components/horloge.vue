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
			<div class="conteneur actif panneau-horloge">
				<div class="contenu inactif">
					<div class="horloge">
						<div class="temps">
							<span class="heures">{{ heure }}</span>
							<span class="separateur">:</span>
							<span class="minutes">{{ minute }}</span>
						</div>
						<canvas />
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
	name: 'PHorloge',
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
			minh: 42,
			statut: '',
			dimensions: {},
			temps: '',
			heure: '',
			minute: '',
			horloge: '',
			canvas: '',
			contexte: '',
			radius: ''
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
			this.redimensionnerHorloge()
		},
		hauteurPage: function () {
			this.positionner()
		}
	},
	created () {
		this.titre = this.$t('horloge')
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
		this.canvas = document.querySelector('#' + this.id + ' canvas')
		this.canvas.width = this.$convertirRem(30)
		this.canvas.height = this.$convertirRem(30)
		this.contexte = this.canvas.getContext('2d')
		this.radius = this.canvas.height / 2
		this.contexte.translate(this.radius, this.radius)
		this.radius = this.radius * 0.90
		this.definirTemps()
		this.temps = setInterval(this.definirTemps, 1000)
		this.dessinerHorloge()
		this.horloge = setInterval(this.dessinerHorloge, 1000)
	},
	beforeDestroy () {
		clearInterval(this.horloge)
	},
	methods: {
		definirTemps () {
			const maintenant = new Date()
			let heure = maintenant.getHours()
			let minute = maintenant.getMinutes()
			if (minute < 10) {
				minute = '0' + minute
			}
			this.heure = heure
			this.minute = minute
		},
		dessinerHorloge () {
			this.contexte.arc(0, 0, this.radius, 0 , 2 * Math.PI)
			this.contexte.fillStyle = '#fff'
			this.contexte.fill()
			this.contexte.beginPath();
			this.contexte.arc(0, 0, this.radius, 0, 2 * Math.PI)
			this.contexte.fillStyle = '#fff'
			this.contexte.fill()
			const grad = this.contexte.createRadialGradient(0, 0 ,this.radius * 0.95, 0, 0, this.radius * 1.05)
			grad.addColorStop(0, '#222')
			grad.addColorStop(1, '#444')
			this.contexte.strokeStyle = grad
			this.contexte.lineWidth = this.radius * 0.1
			this.contexte.stroke()
			// Point noir au milieu
			this.contexte.beginPath()
			this.contexte.arc(0, 0, this.radius * 0.1, 0, 2 * Math.PI)
			this.contexte.fillStyle = '#222'
			this.contexte.fill()
			// Heures
			let angle
			this.contexte.font = this.radius * 0.15 + 'px Orbitron'
			this.contexte.textBaseline = 'middle'
			this.contexte.textAlign = 'center'
			for (let num = 1; num < 13; num++) {
				angle = num * Math.PI / 6
				this.contexte.rotate(angle)
				this.contexte.translate(0, -this.radius * 0.85)
				this.contexte.rotate(-angle)
				this.contexte.fillText(num.toString(), 0, 0)
				this.contexte.rotate(angle)
				this.contexte.translate(0, this.radius * 0.85)
				this.contexte.rotate(-angle)
			}
			// Aiguilles
			const maintenant = new Date()
			let heure = maintenant.getHours()
			let minute = maintenant.getMinutes()
			let seconde = maintenant.getSeconds()
			heure = heure % 12
			heure = (heure * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (seconde * Math.PI / (360 * 60))
			this.dessinerAiguilles(this.contexte, heure, this.radius * 0.5, this.radius * 0.07)
			minute = (minute * Math.PI / 30) + (seconde * Math.PI / (30 * 60))
			this.dessinerAiguilles(this.contexte, minute, this.radius * 0.8, this.radius * 0.07)
			seconde = (seconde * Math.PI / 30)
			this.dessinerAiguilles(this.contexte, seconde, this.radius * 0.9, this.radius * 0.02)
		},
		dessinerAiguilles (contexte, position, longueur, largeur) {
			contexte.beginPath()
			contexte.lineWidth = largeur
			contexte.lineCap = 'round'
			contexte.moveTo(0, 0)
			contexte.rotate(position)
			contexte.lineTo(0, -longueur)
			contexte.stroke()
			contexte.rotate(-position)
		},
		redimensionnerHorloge () {
			this.$nextTick(function () {
				this.canvas.width = this.$convertirRem(30)
				this.canvas.height = this.$convertirRem(30)
				this.radius = this.canvas.height / 2
				this.contexte.translate(this.radius, this.radius)
				this.radius = this.radius * 0.90
			}.bind(this))
		}
	}
}
</script>

<style>
.panneau .panneau-horloge {
	padding: 0!important;
}

.horloge .temps .heures,
.horloge .temps .minutes {
	display: inline-block;
}

.horloge .temps {
	font-family: 'Orbitron', sans-serif;
	font-size: 4rem;
	color: #001d1d;
	background: #00ced1;
	letter-spacing: 0.5rem;
    padding: 2rem;
	display: flex;
	justify-content: center;
	text-align: center;
	user-select: none;
}

.horloge .temps span {
	display: inline-block;
	text-indent: 0.5rem;
}
</style>
