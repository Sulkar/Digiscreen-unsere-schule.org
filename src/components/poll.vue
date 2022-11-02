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
			<div class="conteneur actif panneau-ordre" style="align-items: start;">
				<!-- edit window -->
				<div class="contenu inactif" v-if="mode === 'edition'">
					<label>{{ $t('poll') }}</label>
					
					<label>Deine Frage:</label>
					<div class="items">
						<input type="search" :value="pollTitle"  @input="pollTitle = $event.target.value">
					</div>
					<label>Antwortmöglichkeiten:</label>
					<div class="items">
						<input type="search" :style="{display: pollItem.item === '' ? 'none' : '' }" v-for="(pollItem, index) in pollItems" :value="pollItem.item" @input="pollItems[index].item = $event.target.value" :key="'item_' + index">
					</div>
					<span class="bouton-secondaire" role="button" tabindex="0" :title="$t('ajouterItem')" @click="addOption"><i class="material-icons">add_circle_outline</i></span>
					<div class="actions">
						<span class="bouton" role="button" tabindex="0" @click="generer">{{ $t('valider') }}</span>
					</div>
				</div>
				<!-- show window -->
				<div class="contenu inactif" v-else>
					<h1 style="font-size: 3.2rem; margin-bottom: 2rem;">{{pollTitle}}</h1>
				
					<table style="width: 100%;">
						<tr :style="{display: pollItem.item === '' ? 'none' : ''}" v-for="(pollItem, index) in pollItems" :key="'item_' + index">
							<td style="width:30%;"><span :style="{color: pollItem.color, fontWeight: 'bolder'}">{{pollItem.letter}}</span> - {{ pollItem.item }}</td>
							<td :style="{width:'70%', display: pollVisible ? '' : 'none'}"   >
								<div :style="{backgroundColor: pollItem.color, width: updateBar(pollItem.counter), color: 'white' }"> {{pollItem.counter}}</div>
							</td>
						</tr>						
					</table>
					<div class="pollOptions">
						<div class="item" :style="{display: pollItem.item === '' ? 'none' : ''}" v-for="(pollItem, index) in pollItems" :key="'item_' + index">
							<span class="bouton verifier" role="button" :style="{backgroundColor: pollItem.color}" @click="updatePollCounter(index)">  {{pollItem.letter}} </span>
						</div>
						<div class="item">	<!-- https://fonts.google.com/icons -->	
							<div class="iconButton">					
								<span class="icone"  @click="toggleVisibility()"><i class="material-icons">{{pollVisible ? 'visibility' : 'visibility_off'}}</i></span>
							</div>
						</div>
						<div class="item">	
							<div class="iconButton">					
								<span class="icone" ><i class="material-icons">sentiment_satisfied</i> {{pollCounter}}</span>
							</div>
						</div>
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
	name: 'PPoll',
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
			minh: 15,
			statut: '',
			dimensions: {},
			donnees: { w: 0, h: 0, x: 0, y: 0 },
			type: 'horizontale',

			pollTitle : 'Umfrage',
			pollVisible : true,
			pollItems : [
				{item: "Option 1", letter: "A", counter: 0, color: '#D92B5A'},
				{item: "Option 2", letter: "B", counter: 0, color: '#4192D9'},
				{item: "Option 3", letter: "C", counter: 0, color: '#53A658'},
				{item: "", letter: "D", counter: 0, color: '#F2CA50'},
				{item: "", letter: "E", counter: 0, color: '#F27329'},
			],
			pollCounter: 0,
		}
	},
	watch: {
		export: function (valeur) {
			if (valeur === true) {
				this.$emit('export', { id: this.id, titre: this.titre, mode: this.mode, statut: this.statut, dimensions: this.dimensions, contenu: { items: this.items, type: this.type }, w: this.w, h: this.h, x: this.x, y: this.y, z: this.z })
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
		this.titre = this.$t('poll')
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
		}
		if (this.mode === 'lecture') {
			this.redimensionnement = true
		}
		this.positionner()
	},
	mounted () {
		this.chargement = false
	},
	methods: {
		resetPollItems(){
			this.pollItems.forEach(function (pollItem, index){
				this.pollItems[index].counter = 0;
			}.bind(this));
			this.pollCounter = 0;
		},
		generer () {
			this.resetPollItems();
			if (this.pollItems.length > 0) {
				this.mode = 'lecture'
				this.redimensionnement = true
				if (this.donnees.w > 0 && this.donnees.h > 0) {
					this.w = this.donnees.w
					this.h = this.donnees.h
					
				} else {
					this.w = 50
					this.h = 37
				}
				if (this.donnees.x > 0 && this.donnees.y > 0) {
					this.x = this.donnees.x
					this.y = this.donnees.y
				}
				this.positionner()
				this.pollItems.forEach(function (pollItem, index) {
					this.pollItems[index].item = pollItem.item.trim()
				}.bind(this))
				/*this.pollItems = this.pollItems.filter(function (element) {
					return element.item !== ''
				})*/
			}
		},
		editer () {
			this.$nextTick(function () {
				this.mode = 'edition'
				this.redimensionnement = false
				if (this.statut !== '') {
					this.normaliser()
				}
				this.donnees.w = this.w
				this.donnees.h = this.h
				this.donnees.x = this.x
				this.donnees.y = this.y
				this.w = 46
				this.h = 50.4
				this.positionner()
			}.bind(this))
		},
		addOption () {
			for (let index = 0; index < this.pollItems.length; index++) {
				if(this.pollItems[index].item == ''){
					this.pollItems[index].item = "Option " + (index+1);
					break;
				}				
			}
		},
		updatePollCounter(index){
			this.pollItems[index].counter += 1;
			this.pollCounter += 1;
		},
		
		updateBar(pollItemCounter){
			let maxCounter = 0;
			this.pollItems.forEach(function(pollItem){
				if(pollItem.counter > maxCounter){
					maxCounter = pollItem.counter;
				}
			}.bind(this))		
			let currentPercent = 0;
			if(maxCounter != 0){
				currentPercent= pollItemCounter*100/maxCounter;
			}			 
			return currentPercent + "%";
		},
		toggleVisibility(){
			if(this.pollVisible){
				this.pollVisible = false;
			}else{
				this.pollVisible = true;
			}
		}

	}
}
</script>

<style>
.panneau .conteneur.panneau-ordre .choix {
	margin-bottom: 2rem;
}

.panneau .conteneur .items .item {
	text-align: left;
    padding: 0.5rem 1.5rem;
    border: 1px solid #ddd;
    border-radius: 0.4rem;
	font-size: 3.2rem;
	font-weight: 400;
	line-height: 1.4;
	cursor: move;
	background: #fff;
}

.panneau .conteneur table{
	font-size: 2.2rem;
	border-spacing: 0 15px;
}
.panneau .conteneur table tr{
	margin: 1rem 0 0 0;
}
.panneau .conteneur table td{
	padding: 5px;
}

.panneau .conteneur .pollOptions .item {
	margin: 0.5rem;
}

.pollOptions{
	display: flex;
    justify-content: center;
    align-items: flex-end;
}

.panneau .conteneur .icone {
	display: block;
	padding: 0.7rem 0;
	background: #fff;
	color: #000;
	border-radius: 0.7rem;
}

.panneau .conteneur .icone i {
	font-size: 2.4rem;
	line-height: 1;
}

.iconButton{
	user-select: none;
    text-align: center;
    cursor: pointer;
    margin: 0 0.5rem;
    flex: 0 0 3.8rem;
}
</style>
