import { useTokenContext } from '../../contexts/TokenContext'
import { useFilters } from '../../hooks/useFilters'

export function FilterBar() {
  const { filters } = useTokenContext()
  const { setTeamFilter, setTokenTypeFilter, setDisplayFilter, setRemindersFilter, resetFilters } =
    useFilters()

  return (
    <div className="filters-container">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="teamFilter">Filter by Team:</label>
          <select
            id="teamFilter"
            className="select-input"
            value={filters.team}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">All Teams</option>
            <option value="townsfolk">Townsfolk</option>
            <option value="outsider">Outsiders</option>
            <option value="minion">Minions</option>
            <option value="demon">Demons</option>
            <option value="traveller">Travellers</option>
            <option value="fabled">Fabled</option>
            <option value="loric">Loric</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tokenTypeFilter">Token Type:</label>
          <select
            id="tokenTypeFilter"
            className="select-input"
            value={filters.tokenType}
            onChange={(e) => setTokenTypeFilter(e.target.value)}
          >
            <option value="all">All Tokens</option>
            <option value="character">Characters Only</option>
            <option value="reminder">Reminders Only</option>
            <option value="meta">Meta Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="displayFilter">Display:</label>
          <select
            id="displayFilter"
            className="select-input"
            value={filters.display}
            onChange={(e) => setDisplayFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="official">Official</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="reminderFilter">Reminders:</label>
          <select
            id="reminderFilter"
            className="select-input"
            value={filters.reminders}
            onChange={(e) => setRemindersFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="has">Has Reminders</option>
            <option value="none">No Reminders</option>
          </select>
        </div>
      </div>

      <button className="btn-secondary filter-reset" onClick={resetFilters} title="Reset all filters">
        Reset Filters
      </button>
    </div>
  )
}
