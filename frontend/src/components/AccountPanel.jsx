// Painel do jogador já logado. Por enquanto é a "tela pós-login": só boas-vindas, troca de senha e sair.
export default function AccountPanel({ character, notice, onChangePassword, onLogout }) {
  return (
    <div className={'login' + (character.fx ? ' ' + character.fx : '')}>
      <h2>{character.name}</h2>
      <p>{character.role} · você está na campanha</p>
      {notice && <div className="ok" role="status">{notice}</div>}
      <button className="btn" type="button" onClick={onChangePassword}>ALTERAR SENHA</button>
      <button className="back" type="button" onClick={onLogout}>Sair</button>
    </div>
  )
}
