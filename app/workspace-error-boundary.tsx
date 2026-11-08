import {Component,type ReactNode} from 'react';
export function WorkspaceRecovery({onRetry}:{onRetry:()=>void}){
 return <main className="loginpage"><section className="panel" role="alert"><p className="eyebrow">ACADEMY OS</p><h1>This screen couldn’t open</h1><p>Your saved school records have not been cleared. Try opening the screen again. If you were entering changes, check whether they saved before entering them again.</p><button type="button" className="primary" onClick={onRetry}>Try again</button><p className="footnote">If this continues, tell your campus administrator which screen you were opening. Do not include passwords or private student information.</p></section></main>;
}
export default class WorkspaceErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<WorkspaceRecovery onRetry={()=>this.setState({failed:false})}/>:this.props.children;}
}
