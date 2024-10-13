$(document).ready(function () {
    let dataTable;
    let plantedTable;

    console.log('Document ready, initializing...');

    function loadInitialCSV(filePath) {
        console.log('Loading CSV from:', filePath);
        $.get(filePath, function (csvContent) {
            console.log('CSV loaded successfully');
            Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log('CSV Parsed, row count:', results.data.length);
                    updateSummaryTable(results.data);
                }
            });
        }).fail(function (error) {
            console.error("Error loading CSV file:", error);
        });
    }

    loadInitialCSV('https://patricia2003.github.io/defensores-dashboard/updated_dataset_with_lat_long.csv');

    function updateSummaryTable(data) {
        console.log('Updating summary table with', data.length, 'rows');
        const tableBody = $('#summaryTable tbody');
        tableBody.empty();

        data.forEach((entry, index) => {
            const row = `<tr data-index="${index}">
                <td>${entry.Timestamp || 'N/A'}</td>
                <td>${entry["Email Address"] || 'N/A'}</td>
                <td>${entry["Primer nombre - first name"] || 'N/A'}</td>
                <td>${entry["Apellido - last name"] || 'N/A'}</td>
                <td>${entry["Número de móvil - cell number"] || 'N/A'}</td>
                <td>${entry["Código postal - zip code"] || 'N/A'}</td>
                <td>${entry["Dirección  - address"] || 'N/A'}</td>
                <td>${entry["¿Cuál describe mejor la ubicación de sus árboles? What best describes the place of planting?"] || 'N/A'}</td>
                <td>${entry["¿Cuántos árboles quiere? Todos los árboles plantados son especies nativas"] || 'N/A'}</td>
                <td>${entry["¿quien te ayudo? / who helped you?"] || 'N/A'}</td>
                <td>
                    <select class="status-dropdown" data-row-index="${index}">
                        <option value="Requested" ${entry.Status === 'Requested' ? 'selected' : ''}>Requested</option>
                        <option value="Ordered" ${entry.Status === 'Ordered' ? 'selected' : ''}>Ordered</option>
                        <option value="Planted" ${entry.Status === 'Planted' ? 'selected' : ''}>Planted</option>
                    </select>
                </td>
            </tr>`;
            tableBody.append(row);
        });

        if ($.fn.DataTable.isDataTable('#summaryTable')) {
            console.log('Reinitializing existing summary DataTable');
            dataTable.clear().rows.add($(tableBody).find('tr')).draw();
        } else {
            console.log('Initializing new summary DataTable');
            dataTable = $('#summaryTable').DataTable({
                scrollX: true,
                pageLength: 15
            });
        }
        console.log('Summary table updated and DataTable initialized/reinitialized');
    }

    function movePlantedRows() {
        console.log('Moving planted rows');
        if (!dataTable) {
            console.error("DataTable is not initialized.");
            return;
        }
        
        const plantedTableBody = $('#plantedTable tbody');
        let rowsToMove = [];
    
        dataTable.rows().every(function () {
            const rowNode = this.node();
            const rowStatus = $(rowNode).find('select.status-dropdown').val();
    
            if (rowStatus === 'Planted') {
                const columns = $(rowNode).children('td').map(function () {
                    return $(this).html();
                }).get();
    
                rowsToMove.push(columns);
                this.remove();
            }
        });
    
        console.log('Rows to move:', rowsToMove.length);
    
        rowsToMove.forEach(rowData => {
            const plantedRow = `
                <tr>
                    ${rowData.slice(0, -1).map(cell => `<td>${cell}</td>`).join('')}
                    <td>
                        <select class="planted-status-dropdown">
                            <option value="Planted" selected>Planted</option>
                            <option value="Watered">Watered</option>
                        </select>
                    </td>
                </tr>
            `;
            plantedTableBody.append(plantedRow);
        });
    
        dataTable.draw();
    
        if ($.fn.DataTable.isDataTable('#plantedTable')) {
            console.log('Reinitializing existing planted DataTable');
            plantedTable.clear().rows.add($(plantedTableBody).find('tr')).draw();
        } else {
            console.log('Initializing new planted DataTable');
            plantedTable = $('#plantedTable').DataTable({
                scrollX: true,
                pageLength: 15
            });
        }
        console.log('Planted rows moved and planted table updated');
    }    

    $('#movePlantedButton').on('click', function () {
        console.log('Move Planted Button clicked');
        movePlantedRows();
    });

    $('#statusFilter').on('change', function () {
        console.log('Status filter changed to:', $(this).val());
        if (dataTable) {
            dataTable.draw();
        }
    });

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        if (settings.nTable.id !== 'summaryTable') return true;
        const selectedStatus = $('#statusFilter').val();
        const rowStatus = $(settings.aoData[dataIndex].nTr).find('select.status-dropdown').val();
        return selectedStatus === "" || rowStatus === selectedStatus;
    });

    // Log search events for both tables
    $('#summaryTable_filter input, #plantedTable_filter input').on('keyup', function() {
        const tableId = $(this).closest('table').attr('id');
        console.log(`Search input changed for ${tableId}:`, this.value);
    });
});