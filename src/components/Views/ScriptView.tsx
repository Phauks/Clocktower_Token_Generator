import styles from '../../styles/components/views/Views.module.css'

export function ScriptView() {
  return (
    <div className={styles.scriptView}>
      <div className={styles.scriptViewPlaceholder}>
        <div className={styles.placeholderIcon}>🔧</div>
        <h2>Script Builder</h2>
        <p>Coming Soon</p>
        <p className={styles.placeholderDescription}>
          This feature will allow you to build and manage Blood on the Clocktower scripts
          with a visual editor, character balancing tools, and more.
        </p>
      </div>
    </div>
  )
}
