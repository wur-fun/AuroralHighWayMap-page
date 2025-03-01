class Map {
    constructor() {
        this.map = L.map('map', {
            crs: L.CRS.Simple,
            maxZoom: 5,
            minZoom: 0
        });
        
        this.layers = {
            overworld: L.layerGroup(),
            nether: L.layerGroup(),
            end: L.layerGroup()
        };

        this.initMap();
        this.loadData();
        this.addEventListeners();
    }

    initMap() {
        const bounds = [[-5000, -5000], [5000, 5000]];
        this.map.setView([0, 0], 1);
        this.map.fitBounds(bounds);
    }

    async loadData() {
        try {
            const dimensions = ['overworld', 'nether', 'end'];
            for (const dim of dimensions) {
                const response = await fetch(`data/${dim}.json`);
                const data = await response.json();
                this.renderDimension(data);
            }
        } catch (error) {
            console.error('数据加载失败:', error);
        }
    }

    renderDimension(data) {
        const layer = this.layers[data.dimension];
        
        data.stations.forEach(station => {
            const marker = L.circleMarker([station.x, station.z], {
                color: data.color,
                radius: station.transfer ? 8 : 5
            }).bindPopup(`
                <h3>${station.name}</h3>
                <p>坐标：X=${station.x}, Z=${station.z}</p>
                <p>线路：${station.lines.join(', ')}</p>
            `);
            
            layer.addLayer(marker);
        });
        
        this.map.addLayer(layer);
    }
      data.lines?.forEach(line => {
            const coordinates = line.stations.map(name => {
                const station = data.stations.find(s => s.name === name);
                return [station.x, station.z];
            });
            if(line.isLoop && coordinates.length > 0) {
                coordinates.push(coordinates[0]);
            }

            L.polyline(coordinates, {
                color: line.status === 'operational' ? line.color : '#CCCCCC',
                weight: 3,
                dashArray: line.status === 'planned' ? '5,5' : null
            }).addTo(layer);
        });

        data.stations.forEach(station => {
            const isHub = station.x === 0 && station.z === 0;
            const marker = L.circleMarker([station.x, station.z], {
                color: station.status === 'operational' ? data.color : '#999',
                fillColor: station.status === 'operational' ? data.color : '#EEE',
                radius: isHub ? 10 : station.transfer ? 8 : 5,
                weight: isHub ? 3 : 1
            }).bindPopup(this.createPopupContent(station));
            
            layer.addLayer(marker);
        });
        
        this.map.addLayer(layer);
    }

    createPopupContent(station) {
        return `
            <div class="station-popup">
                <h3>${station.name}</h3>
                <p class="status ${station.status}">状态：${{
                    operational: '运营中',
                    planned: '规划中'
                }[station.status]}</p>
                <p>坐标：X=${station.x}, Z=${station.z}</p>
                <p>线路：${station.lines.join(', ')}</p>
            </div>
        `;
    }

    addEventListeners() {
        document.querySelectorAll('#dimension-selector button').forEach(btn => {
            btn.addEventListener('click', () => {
                const dim = btn.dataset.dim;
                this.switchDimension(dim);
            });
        });
    }

    switchDimension(dim) {
        Object.keys(this.layers).forEach(key => {
            if (key === dim) {
                this.map.addLayer(this.layers[key]);
            } else {
                this.map.removeLayer(this.layers[key]);
            }
        });
        
        document.querySelectorAll('#dimension-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dim === dim);
        });
    }
}

// 初始化
new Map();
