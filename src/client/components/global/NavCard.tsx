//Modules
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";

//Interfaces
interface IProps {
	children: ReactNode;
	to: string;
}

export function NavCard({ to, children }: IProps) {
	return (
		<Link className="card nav-card" to={to}>
			{children}
		</Link>
	);
}
