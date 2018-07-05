// https://github.com/ciotlosm/custom-lovelace

function _filterEntityId(stateObj, pattern) {
  if (pattern.indexOf('*') === -1) {
    return stateObj.entity_id === pattern;
  }
  const regEx = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  return stateObj.entity_id.search(regEx) === 0;
}

function _getEntities(hass, filters) {
  const entities = new Set();
  filters.forEach((filter) => {
    const filters = [];
    if (filter.domain) {
      filters.push(stateObj => stateObj.entity_id.split('.', 1)[0] === filter.domain);
    }
    if (filter.entity_id) {
      filters.push(stateObj => _filterEntityId(stateObj, filter.entity_id));
    }
    if (filter.state) {
      filters.push(stateObj => stateObj.state === filter.state);
    }

    Object.values(hass.states).forEach((stateObj) => {
      if (filters.every(filterFunc => filterFunc(stateObj))) {
        entities.add(stateObj.entity_id);
      }
    });
  });
  return Array.from(entities);
}

class MonsterCard extends HTMLElement {
  setConfig(config) {
    if (!config.filter.include || !Array.isArray(config.filter.include)) {
      throw new Error('Please define filters');
    }

    if (this.lastChild) this.removeChild(this.lastChild);

    const cardConfig = Object.assign({}, config);
    if (!cardConfig.card) cardConfig.card = {};
    if (!cardConfig.card.type) cardConfig.card.type = 'entities';

    const element = document.createElement(`hui-${cardConfig.card.type}-card`);
    this.appendChild(element);

    this._config = cardConfig;
  }

  set hass(hass) {
    const config = this._config;
    let entities = _getEntities(hass, config.filter.include);
    if (config.filter.exclude) {
      const excludeEntities = _getEntities(hass, config.filter.exclude);
      entities = entities.filter(entity => !excludeEntities.includes(entity));
    }
    entities.sort();

    if (!config.card.entities || config.card.entities.length !== entities.length ||
        !config.card.entities.every((value, index) => value === entities[index])) {
      config.card.entities = entities;
      this.lastChild.setConfig(config.card);
    }

    this.lastChild.hass = hass;
  }

  getCardSize() {
    return 'getCardSize' in this.lastChild ? this.lastChild.getCardSize() : 1;
  }
}

customElements.define('monster-card', MonsterCard);
