import React from 'react'

const style: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 20,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'calc(10px + 2vmin)'
}

export const CenteredCard: React.FC = ({ children }) => (
  <div style={style}>{children}</div>
)
